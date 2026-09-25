"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Bot, ClipboardCheck, MessageSquareQuote, PenLine, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAssessmentServer, reviewAssessment } from "@/features/assessments/actions/assessments";
import type { AssessmentDetailResponse, AssessmentListItem, AssessmentReviewStatus, PaginatedResponse } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Panel } from "@/components/layout/Kpi";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { ASSESSMENT_STATUS_LABEL, REVIEW_META } from "@/features/assessments/components/AssessmentsIndex";
import { RiskBadge } from "@/features/risks/components/RiskBadge";
import { toRiskLevel } from "@/features/risks/lib/risk";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  summary: z.string().trim().min(3, "Add a short clinical summary."),
  observations: z.string().trim().min(1, "Add at least one observation, or write “None”."),
  followUp: z.string().trim().max(500, "Keep the follow-up under 500 characters.").optional(),
  status: z.enum(["DRAFT", "REVIEWED", "FOLLOW_UP_REQUIRED"]),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const REVIEW_OPTIONS: Array<{ value: AssessmentReviewStatus; label: string; hint: string }> = [
  { value: "REVIEWED", label: "Reviewed", hint: "Signed off, no action needed" },
  { value: "FOLLOW_UP_REQUIRED", label: "Follow-up required", hint: "Flags the patient for action" },
  { value: "DRAFT", label: "Save as draft", hint: "Keep editing later" },
];

function reviewFormValues(detail: AssessmentDetailResponse | null): ReviewFormValues {
  return {
    summary: detail?.professionalReview?.summary ?? "",
    observations: (detail?.professionalReview?.observations ?? []).join("\n"),
    followUp: detail?.professionalReview?.followUp ?? "",
    status: detail?.professionalReview?.status ?? "REVIEWED",
  };
}

export function AssessmentPanel({
  patientId,
  assessments,
  initialAssessmentId,
  initialDetail,
}: {
  patientId: string;
  assessments: PaginatedResponse<AssessmentListItem>;
  initialAssessmentId?: string;
  initialDetail?: AssessmentDetailResponse | null;
}) {
  const [items, setItems] = useState(assessments.data);
  const [selectedId, setSelectedId] = useState(initialDetail?.id ?? initialAssessmentId ?? assessments.data[0]?.id);
  const [detail, setDetail] = useState<AssessmentDetailResponse | null>(initialDetail ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const form = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema), defaultValues: reviewFormValues(initialDetail ?? null) });

  const load = useCallback(
    async (assessmentId: string) => {
      setLoading(true);
      setError(null);
      try {
        setDetail(await getAssessmentServer(patientId, assessmentId));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load the assessment.");
      } finally {
        setLoading(false);
      }
    },
    [patientId],
  );

  useEffect(() => {
    if (!selectedId || detail) return;
    const timer = window.setTimeout(() => void load(selectedId), 0);
    return () => window.clearTimeout(timer);
  }, [detail, load, selectedId]);

  const selectAssessment = (assessmentId: string) => {
    if (assessmentId === selectedId) return;
    setSelectedId(assessmentId);
    setDetail(null);
    setError(null);
  };

  const openReview = () => {
    form.reset(reviewFormValues(detail));
    setReviewOpen(true);
  };

  const handleReview = form.handleSubmit(async (values) => {
    if (!selectedId) return;
    try {
      await reviewAssessment(patientId, selectedId, {
        summary: values.summary,
        observations: values.observations.split("\n").map((value) => value.trim()).filter(Boolean),
        followUp: values.followUp || undefined,
        status: values.status,
      });
      setItems((current) => current.map((item) => (item.id === selectedId ? { ...item, reviewStatus: values.status } : item)));
      setReviewOpen(false);
      toast.success(values.status === "DRAFT" ? "Review draft saved" : "Review saved");
      await load(selectedId);
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Could not save the review.");
    }
  });

  if (items.length === 0) {
    return <ChartEmpty title="No assessments yet" hint="MIRA assessments completed by this patient will appear here." />;
  }

  const risk = toRiskLevel(detail?.riskLevel);
  const review = detail?.professionalReview ?? null;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* List */}
      <nav aria-label="Assessments" className="min-w-0">
        <ul className="max-h-[720px] space-y-1.5 overflow-y-auto">
          {items.map((assessment) => {
            const active = assessment.id === selectedId;
            return (
              <li key={assessment.id}>
                <button
                  type="button"
                  onClick={() => selectAssessment(assessment.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "w-full cursor-pointer rounded-xl border px-3.5 py-3 text-left transition-colors",
                    active ? "border-slate-900 bg-white shadow-sm ring-1 ring-slate-900" : "border-slate-200/80 bg-white hover:border-slate-300",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-slate-900">{format(new Date(assessment.completedAt ?? assessment.startedAt), "MMM d, yyyy")}</span>
                    <Badge variant={REVIEW_META[assessment.reviewStatus].variant}>{REVIEW_META[assessment.reviewStatus].label}</Badge>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">MIRA · {ASSESSMENT_STATUS_LABEL[assessment.status]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Detail */}
      <div className="min-w-0 space-y-5">
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}{" "}
            {selectedId && (
              <button type="button" onClick={() => void load(selectedId)} className="cursor-pointer font-semibold underline">
                Retry
              </button>
            )}
          </p>
        )}

        {(loading || (!detail && !error)) && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading assessment">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        )}

        {detail && !loading && (
          <>
            {/* Header */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">MIRA diagnostic assessment</h3>
                    <Badge variant={REVIEW_META[review?.status ?? "PENDING"].variant} dot>{REVIEW_META[review?.status ?? "PENDING"].label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Started {format(new Date(detail.startedAt), "MMM d, yyyy · HH:mm")}
                    {detail.completedAt ? ` · completed ${format(new Date(detail.completedAt), "MMM d, HH:mm")}` : ""}
                  </p>
                </div>
                <Button size="sm" variant={review ? "secondary" : "primary"} onClick={openReview}>
                  {review ? <PenLine size={14} aria-hidden /> : <ClipboardCheck size={14} aria-hidden />}
                  {review ? "Edit review" : "Write review"}
                </Button>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 sm:grid-cols-4">
                <Meta label="Orientation" value={detail.orientation ?? "—"} />
                <Meta label="Risk level" value={risk ? <RiskBadge level={risk} /> : detail.riskLevel ?? "—"} />
                <Meta label="AI confidence" value={detail.confidence === null ? "—" : `${Math.round(detail.confidence <= 1 ? detail.confidence * 100 : detail.confidence)}%`} />
                <Meta label="Status" value={`${ASSESSMENT_STATUS_LABEL[detail.status]} · ${detail.language.toUpperCase()}`} />
              </dl>
            </section>

            {/* Professional review */}
            {review && (
              <Panel title="Professional review" description={review.reviewedAt ? `Signed ${format(new Date(review.reviewedAt), "MMM d, yyyy")}` : `Last edited ${format(new Date(review.updatedAt), "MMM d, yyyy")}`}>
                <p className="text-sm leading-6 text-slate-800">{review.summary}</p>
                {review.observations.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {review.observations.map((item, index) => (
                      <li key={index} className="flex gap-2 text-sm text-slate-700">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {review.followUp && (
                  <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-sm text-orange-900">
                    <span className="font-semibold">Follow-up:</span> {review.followUp}
                  </p>
                )}
              </Panel>
            )}

            {/* AI analysis */}
            <Panel
              title={
                <span className="flex items-center gap-2">
                  <Bot size={16} aria-hidden className="text-teal-700" /> {detail.aiAnalysis?.label || "MIRA analysis"}
                </span>
              }
              description="AI-assisted information, not a diagnosis"
              action={<Badge variant="brand"><Sparkles size={11} aria-hidden /> AI</Badge>}
            >
              <p className="text-sm leading-6 text-slate-700">{detail.aiAnalysis?.summary || "No analysis summary is available for this assessment."}</p>
              {(detail.aiAnalysis?.observedPatterns?.length ?? 0) > 0 && (
                <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200/80">
                  {detail.aiAnalysis.observedPatterns.map((pattern, index) => (
                    <div key={index} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-xs font-medium text-slate-500">{pattern.label ?? `Pattern ${index + 1}`}</dt>
                      <dd className="text-sm text-slate-800">
                        {pattern.value !== undefined && pattern.value !== null && <span className="font-semibold">{String(pattern.value)}</span>}
                        {pattern.description && <span className={cn("block text-slate-600", pattern.value !== undefined && pattern.value !== null && "mt-0.5 text-xs")}>{pattern.description}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </Panel>

            {/* Transcript */}
            <Panel
              title={
                <span className="flex items-center gap-2">
                  <MessageSquareQuote size={16} aria-hidden className="text-slate-500" /> Patient responses
                </span>
              }
              description={`${detail.patientResponses?.length ?? 0} answers · stage ${detail.stage}`}
            >
              {(detail.patientResponses ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No responses recorded.</p>
              ) : (
                <ol className="space-y-4">
                  {[...detail.patientResponses]
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((response) => (
                      <li key={response.messageId} className="flex gap-3">
                        <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">{response.sequence}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">{response.question ?? "Open response"}</p>
                          <p className="mt-1 break-words rounded-xl rounded-tl-sm bg-slate-50 px-3.5 py-2.5 text-sm leading-6 text-slate-800 ring-1 ring-slate-200/70">{response.answer}</p>
                        </div>
                      </li>
                    ))}
                </ol>
              )}
            </Panel>
          </>
        )}
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{review ? "Edit professional review" : "Professional review"}</DialogTitle>
            <DialogDescription>Record your clinical interpretation. It becomes part of the patient record.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleReview} className="space-y-4">
              <FormField control={form.control} name="summary" render={({ field }) => (
                <FormItem><FormLabel>Summary</FormLabel><FormControl><Input {...field} placeholder="One-line clinical interpretation" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="observations" render={({ field }) => (
                <FormItem><FormLabel>Observations</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="One observation per line" className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="followUp" render={({ field }) => (
                <FormItem><FormLabel>Follow-up <span className="font-normal text-slate-500">(optional)</span></FormLabel><FormControl><Input {...field} placeholder="Recommended next step" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                    {REVIEW_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === option.value}
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 text-left transition-colors",
                          field.value === option.value ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300",
                        )}
                      >
                        <span className="block text-[13px] font-semibold text-slate-900">{option.label}</span>
                        <span className="block text-[11px] text-slate-500">{option.hint}</span>
                      </button>
                    ))}
                  </div>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</Button>
                <Button type="submit" loading={form.formState.isSubmitting}>Save review</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-white px-3.5 py-2.5">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-semibold capitalize text-slate-900">{value}</dd>
    </div>
  );
}
