/* SPDX-License-Identifier: MIT
 * Brettel, Viénot & Mollon 1997, tritanopia reference.
 * Precomputed linear-sRGB half-plane projection matrices and separation
 * normal from DaltonLens/libDaltonLens/libDaltonLens.c (public domain).
 * https://github.com/DaltonLens/libDaltonLens
 *
 * Unlike Machado's shifted S-cone approximation, this projects dichromat
 * colours onto the two planes selected by the sign of the separation dot.
 * For anomalous/partial severity the projected result is interpolated in
 * LINEAR light. That partial interpolation is approximate, not a clinical
 * model of tritanomaly.
 */
export const BRETTEL_TRITAN=Object.freeze({
  wing1:Object.freeze([
    1.01277,0.13548,-0.14826,
    -0.01243,0.86812,0.14431,
    0.07589,0.80500,0.11911
  ]),
  wing2:Object.freeze([
    0.93678,0.18979,-0.12657,
    0.06154,0.81526,0.12320,
    -0.37562,1.12767,0.24796
  ]),
  separation:Object.freeze([0.03901,-0.02788,-0.01113])
});
