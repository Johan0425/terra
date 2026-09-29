// Pure function translating real BMI into the avatar's body-weight morph
// target influence — same "keep the math separate from rendering" spirit as
// lib/avatarEngine.ts. See components/avatar/AvatarModel.tsx's `bodyWeight`
// prop and scripts/generate-body-morphs.mjs for how the morph itself works.

/** BMI thresholds mapped to the -1 (thin) .. 1 (heavy) morph range. Tune freely. */
const BMI_UNDERWEIGHT = 18.5; // morph -1 here and below
const BMI_NORMAL = 22; // morph 0 (neutral, as-authored) here
const BMI_OBESE = 32; // morph +1 here and above

export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Maps BMI to a -1..1 morph influence, piecewise-linear around the "normal"
 * point so small BMI changes near 22 stay subtle, same as real body changes.
 */
export function bodyWeightFromBMI(bmi: number): number {
  if (bmi <= BMI_UNDERWEIGHT) return -1;
  if (bmi >= BMI_OBESE) return 1;
  if (bmi < BMI_NORMAL) {
    return -((BMI_NORMAL - bmi) / (BMI_NORMAL - BMI_UNDERWEIGHT));
  }
  return (bmi - BMI_NORMAL) / (BMI_OBESE - BMI_NORMAL);
}

export function bodyWeightFromProfile(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): number {
  if (!heightCm || !weightKg) return 0;
  return bodyWeightFromBMI(calculateBMI(heightCm, weightKg));
}
