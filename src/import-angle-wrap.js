/** Translate a detected image line's absolute angle into the relative
 * diagonalRotation control. Modulo 360 is necessary: clamping a difference
 * such as 179 - (-80) = 259 to the slider's +180 bound rotates the generated
 * shape incorrectly. The equivalent -101 preserves the exact direction.
 * Use 360 rather than 180 to retain direction-sensitive loops/hairpins. */
export function importedAngleDeltaDegrees(target,baseline){
  if(!Number.isFinite(target)||!Number.isFinite(baseline))
    throw new RangeError('An imported line angle must be finite');
  return ((target-baseline+180)%360+360)%360-180;
}
