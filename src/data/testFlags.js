// Temporary frontend-only flags for testing the solve flow.
//
// IMPORTANT:
// - These values are visible in the browser bundle.
// - This is NOT secure and must be replaced by a backend flag check.
// - Forensics flags are placeholders; the Cryptography flags are the decoded
//   answers from the current challenge questions.
//
// To test a challenge, open it and submit its flag in the modal.

export const TEST_FLAGS = Object.freeze({
    'fore-1': 'flag{T4bby_Wisp3rs_Myst3ri0us}',
    'fore-2': 'flag{m3t4d4t4_l34ks_wh1l3_zip_h1d3s_1n_pl41n_s1ght}',
    'fore-3': 'flag{Wh1sk_Th3_M4tch4_0r_L0s3_Th3_S3cr3t!}',


    'crypto-1': 'flag{c4n_y0u_r34d_7h15}',
    'crypto-2': 'flag{b1n4ry_b1ts}',
    'crypto-3': 'flag{b4s3_32_1s_c0mm0n}',
})

export function isCorrectTestFlag(challengeId, submittedFlag) {
    const expected = TEST_FLAGS[challengeId]
    if (!expected) return false

    return submittedFlag.trim() === expected
}
