import { useCallback, useEffect, useState } from 'react'
import ChallengeCard from '../components/ChallengeCard.jsx'
import ChallengeModal from '../components/ChallengeModal.jsx'
import CatsTailImage from '../assets/Images/Miming.png'
import LastLightImage from '../assets/Images/last_light.jpg'
import Matcha from '../assets/Images/my_golisden_matischa_laistte_raistio.jpg'

// Put each challenge's data here. Add as many as you like.
const CATEGORIES = [
    {
        title: 'Forensics',
        challenges: [
            {
                id: 'fore-1',
                name: 'Cute Miming',
                points: 50,
                question:
                    'A friend sent you a photo of their cat, but something about it feels off.\nFind the hidden message inside the image.',
                file: CatsTailImage,
                steps: [
                    {
                        text: 'Download the image and open it in an image viewer.',
                        info: {
                            title: 'What is Steganography?',
                            body: 'Steganography is the practice of hiding secret data inside ordinary, non-secret files or messages. Unlike encryption, which makes data unreadable, steganography hides the fact that secret data exists at all — for example, inside images, audio files, or video.',
                        },
                    },
                    {
                        text: 'Go to https://aperisolve.fr/ in your web browser.',
                        info: {
                            title: 'What is Aperisolve?',
                            body: 'Aperisolve is a free online steganography analysis platform. It automatically runs many popular steg tools (zsteg, steghide, outguess, exiftool, binwalk, strings, and more) on an uploaded image and displays their combined results in a single view.',
                            link: 'https://aperisolve.fr/',
                        },
                    },
                    {
                        text: 'Drag and drop the image into the Aperisolve tool or choose a file and find the image on your computer.',
                    },
                    {
                        text: 'Click Analyze and wait for the tool to process the image.',
                    },
                    {
                        text: 'Look for any hidden messages or text that may appear in the results.',
                    },
                    {
                        text: 'In the Decomposer (Blue section) you can find the first part of the flag.',
                        info: {
                            title: 'What is Bit-Plane Decomposition?',
                            body: 'Bit-plane decomposition splits an image into individual bit layers. Data hidden using LSB (Least Significant Bit) steganography is stored in the lowest bit of each pixel, making it invisible to the human eye but detectable by tools like Aperisolve\'s Decomposer.',
                        },
                    },
                    {
                        text: 'In the Identify section find the Comment field — it contains the second part of the flag.',
                        info: {
                            title: 'What is EXIF / Image Metadata?',
                            body: 'EXIF (Exchangeable Image File Format) metadata is extra information embedded in image files, such as the camera model, GPS coordinates, timestamps, and custom comment fields. Tools like ExifTool and Aperisolve\'s Identify tab can read and display this hidden metadata.',
                        },
                    },
                ],
            },
            {
                id: 'fore-2',
                name: 'Last Light',
                points: 50,
                question:
                    'A coastguard archivist found this photo of Greywatch Point lighthouse in a decommissioned camera. The keepers logbook was supposedly sealed with the photo itself. Can you open it?',
                file: LastLightImage,
                steps: [
                    {
                        text: 'Download the image and open it in an image viewer. It looks like a normal photo, so the secret must be hidden in the file itself.',
                        info: {
                            title: 'File Carving',
                            body: 'File carving is a technique for recovering files or data hidden inside another file, without relying on the file system. Tools like Binwalk scan for known file signatures (magic bytes) to detect embedded archives, images, or executables.',
                        },
                    },
                    {
                        text: 'Go to https://aperisolve.fr/ in your web browser.',
                        info: {
                            title: 'What is Aperisolve?',
                            body: 'Aperisolve is a free online steganography analysis platform. It automatically runs many popular steg tools (zsteg, steghide, outguess, exiftool, binwalk, strings, and more) on an uploaded image and displays their combined results in a single view.',
                            link: 'https://aperisolve.fr/',
                        },
                    },
                    {
                        text: 'Drag and drop the image into the Aperisolve tool or choose the file from your computer, then click Analyze and wait for the results.',
                    },
                    {
                        text: 'Open the Identify tab and look through the metadata. Find the User Comment field, which contains a strange string: YmVhY29uX2tlZXBlcl8xOTg3',
                        info: {
                            title: 'What is EXIF Metadata?',
                            body: 'EXIF metadata is extra information embedded in image files. The "User Comment" field is a free-form field that cameras and software can write to, making it a common spot to hide data in forensics challenges.',
                        },
                    },
                    {
                        text: 'That string is Base64. Go to https://gchq.github.io/CyberChef/ and add the "From Base64" operation, then paste the string as the input. The output is the password: beacon_keeper_1987',
                        info: {
                            title: 'What is Base64?',
                            body: 'Base64 is a binary-to-text encoding scheme that represents binary data using 64 printable ASCII characters (A–Z, a–z, 0–9, +, /). It is widely used to safely transport binary data in text-only contexts. It is NOT encryption — anyone can decode it.',
                            link: 'https://gchq.github.io/CyberChef/',
                        },
                    },
                    {
                        text: 'The Copyright field says the logbook is sealed, so there must be a locked file hiding inside the image. Go back to Aperisolve and open the Binwalk tab. It shows a Zip archive hidden after the end of the JPEG data.',
                        info: {
                            title: 'What is Binwalk?',
                            body: 'Binwalk is a tool for searching binary images for embedded files and executable code. It uses a database of "magic bytes" — unique byte sequences at the start of known file formats — to find and extract files hidden inside other files.',
                        },
                    },
                    {
                        text: 'Extract the hidden zip. Either download the extracted file from the Binwalk results, or rename last_light.jpg to last_light.zip and open it with an online unzip tool such as https://www.ezyzip.com/unzip-files-online.html',
                        info: {
                            title: 'ZIP Polyglot Files',
                            body: 'A polyglot file is a file that is simultaneously valid in two different formats. JPEG files end with the bytes FF D9; any data appended after that is ignored by image viewers but can be read by ZIP tools — allowing a single file to be both a valid image and a valid ZIP archive.',
                        },
                    },
                    {
                        text: 'When asked for a password, enter beacon_keeper_1987 and extract the archive.',
                    },
                    {
                        text: 'Open flag.txt. The text inside is the flag.',
                    },
                ],
            },
            {
                id: 'fore-3',
                name: 'Don’t Tell Kuromi',
                points: 100,
                question:
                    'My Melody’s Cafe is famous for its golden matcha latte, and the secret recipe is strictly confidential. She snapped a photo of her latest creation, but she may have left more than just the recipe behind. Dig into the photo, find what’s hidden, and recover the secret before Kuromi does.',
                file: Matcha,
                steps: [
                    {
                        text: 'This is a Special Problem Challenge. You will need to find the hidden message in the image and submit it as a flag.',
                    },
                ],
            },
            // more Forensics challenges
        ],
    },
    {
        title: 'Cryptography',
        challenges: [
            {
                id: 'crypto-1',
                name: 'Can You Read Me',
                points: 10,
                question: 'Decode this message:\n\nc4n_y0u_r34d_7h15',
                steps: [
                    {
                        text: 'Look closely at the ciphertext. Some letters have been replaced with numbers.',
                        info: {
                            title: 'What is Leetspeak (1337)?',
                            body: 'Leetspeak (or "leet") is an informal alphabet that substitutes letters with visually similar numbers or symbols. It originated in early internet culture and hacker communities. Common substitutions: A→4, E→3, I→1, O→0, T→7, S→5.',
                        },
                    },
                    {
                        text: 'This technique is commonly called leetspeak (1337).',
                    },
                    {
                        text: 'Try replacing 4 with A, 0 with O, 3 with E, 7 with T, and 1 with I.',
                    },
                    {
                        text: 'Read the decoded message and submit it using the required flag format.',
                    },
                ],
            },
            {
                id: 'crypto-2',
                name: 'Zero Knowledge One Answer',
                points: 10,
                question: 'Decode this message:\n\n01100110 01101100 01100001 01100111 01111011 01100010 00110001 01101110 00110100 01110010 01111001 01011111 01100010 00110001 01110100 01110011 01111101',
                steps: [
                    {
                        text: 'Copy the encrypted message.',
                    },
                    {
                        text: 'Go to https://gchq.github.io/CyberChef/',
                        info: {
                            title: 'What is CyberChef?',
                            body: 'CyberChef is a free, open-source web tool by GCHQ (the UK\'s intelligence agency) nicknamed "the Cyber Swiss Army Knife". It supports hundreds of encoding, encryption, compression, and data analysis operations that can be chained together into a "recipe" for quick decoding.',
                            link: 'https://gchq.github.io/CyberChef/',
                        },
                    },
                    {
                        text: 'Search for the operation "From Binary" and drag it to the recipe area.',
                        info: {
                            title: 'What is Binary Encoding?',
                            body: 'Binary encoding represents data as sequences of 0s and 1s. Each group of 8 bits (a byte) corresponds to one character in ASCII. For example, 01100110 = 102 in decimal = "f" in ASCII. Reading binary is a fundamental skill in computing and CTF challenges.',
                        },
                    },
                    {
                        text: 'Paste the encrypted message into the input area.',
                    },
                    {
                        text: 'Click on the "Bake!" button to decode the message.',
                    },
                    {
                        text: 'Read the decoded message and submit it using the required flag format.',
                    },
                ],
            },
            {
                id: 'crypto-3',
                name: 'Too Common',
                points: 10,
                question: 'Hint: Only 32 People Know the Answer\n\nDecode this message:\n\nMZWGCZ33MI2HGM27GMZF6MLTL5RTA3LNGBXH2===',
                steps: [
                    {
                        text: 'Copy the encrypted message.',
                    },
                    {
                        text: 'Go to https://gchq.github.io/CyberChef/',
                        info: {
                            title: 'What is CyberChef?',
                            body: 'CyberChef is a free, open-source web tool by GCHQ nicknamed "the Cyber Swiss Army Knife". It supports hundreds of encoding and decoding operations you can chain together into a recipe.',
                            link: 'https://gchq.github.io/CyberChef/',
                        },
                    },
                    {
                        text: 'Search for the operation "From Base32" and drag it to the recipe area.',
                        info: {
                            title: 'What is Base32?',
                            body: 'Base32 encodes binary data using 32 characters (A–Z and 2–7) plus "=" padding. It is less common than Base64 but useful when case-sensitivity is a problem (since it uses only uppercase letters). The hint "Only 32 People Know the Answer" is a clue pointing to Base32.',
                        },
                    },
                    {
                        text: 'Paste the encrypted message into the input area.',
                    },
                    {
                        text: 'Click on the "Bake!" button to decode the message.',
                    },
                    {
                        text: 'Read the decoded message and submit it using the required flag format.',
                    },
                ],
            },

            // more crypto challenges
        ],
    },
]

function Challenges() {
    const [activeChallenge, setActiveChallenge] = useState(null)

    useEffect(() => {
        document.title = 'Challenges · decryptme'
    }, [])

    // Called when a ChallengeCard is clicked
    const openChallenge = (challenge, category) => {
        setActiveChallenge({ ...challenge, category })
    }

    const closeChallenge = useCallback(() => setActiveChallenge(null), [])

    return (
        <main className="relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-7 sm:px-8 lg:pt-9">
            {CATEGORIES.map((category, index) => (
                <section key={category.title}>
                    <p
                        className={`font-mono text-[30px] uppercase tracking-[0.2em] text-neon/75 ${index > 0 ? 'mt-10' : ''
                            }`}
                    >
                        {category.title}
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-6">
                        {category.challenges.map((challenge) => (
                            <ChallengeCard
                                key={challenge.id}
                                challengeName={challenge.name}
                                challengePoints={challenge.points}
                                onClick={() =>
                                    openChallenge(challenge, category.title)
                                }
                            />
                        ))}
                    </div>
                </section>
            ))}

            {activeChallenge && (
                <ChallengeModal
                    challenge={activeChallenge}
                    onClose={closeChallenge}
                />
            )}
        </main>
    )
}

export default Challenges