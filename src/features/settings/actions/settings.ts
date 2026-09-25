"use server";

import { psychologistApi, type UpdatePsychologistDto } from "@/lib/api/psychologist";

export async function updatePsychologistProfile(dto: UpdatePsychologistDto) {
  return psychologistApi.updateMe(dto);
}
