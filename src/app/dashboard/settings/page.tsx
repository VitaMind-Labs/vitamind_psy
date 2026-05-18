"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Clock, CreditCard, Save, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockProfile } from "@/lib/mock-data";

export default function SettingsPage() {
  const [bio, setBio] = useState(mockProfile.bio);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col gap-5">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile"><User size={15} /> Profil</TabsTrigger>
            <TabsTrigger value="availability"><Clock size={15} /> Disponibilités</TabsTrigger>
            <TabsTrigger value="subscription"><CreditCard size={15} /> Abonnement</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
                    {mockProfile.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{mockProfile.name}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--foreground-muted)" }}>{mockProfile.speciality}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-soft)" }}>RPPS: {mockProfile.licenseNumber}</p>
                  </div>
                </div>
                <Separator className="mb-5" />
                <div className="mb-5">
                  <Label>Email professionnel</Label>
                  <p className="text-sm mt-1 px-4 py-2.5 rounded-[var(--radius-sm)]" style={{ background: "var(--surface-secondary)", color: "var(--foreground)" }}>
                    {mockProfile.email}
                  </p>
                </div>
                <div className="mb-5">
                  <Label>Biographie médicale</Label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                    className="input-ui w-full p-4 rounded-[var(--radius-sm)] text-sm resize-none mt-1"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}><Save size={16} />{saved ? "Enregistré !" : "Enregistrer"}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardContent className="p-5 md:p-6">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Horaires de disponibilité</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {mockProfile.availability.map((slot) => (
                    <div key={slot.day} className="flex items-center justify-between p-3 rounded-[var(--radius-sm)]" style={{ background: "var(--gradient-soft)" }}>
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{slot.day}</span>
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{slot.start} – {slot.end}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <Button variant="secondary">Modifier les horaires</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardContent className="p-5 md:p-6">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Abonnement</h3>
                <div className="flex items-center justify-between p-4 rounded-[var(--radius-sm)]" style={{ background: "var(--gradient-soft)" }}>
                  <div>
                    <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Plan Professionnel</p>
                    <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                      {mockProfile.subscriptionEndsAt ? `Expire le ${new Date(mockProfile.subscriptionEndsAt).toLocaleDateString("fr-FR")}` : "Statut actif"}
                    </p>
                  </div>
                  <Badge variant={mockProfile.subscriptionStatus === "active" ? "success" : "warning"}>
                    {mockProfile.subscriptionStatus === "active" ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button variant="secondary">Gérer l'abonnement</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
