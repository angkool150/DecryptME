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
                    'Download the image and open it in an image viewer.',
                    'Go to https://aperisolve.fr/ in your web browser.',
                    'Drag and drop the image into the Aperisolve tool or Choose a file and find the image on your computer.',
                    'Click Analyze and wait for the tool to process the image.',
                    'Look for any hidden messages or text that may appear in the results.',
                    'In the Decomposer in the Blue part yoo can find the first part of the flag',
                    'In the Identify find the Comment and you can find the second part of the flag',

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
                    'Download the image and open it in an image viewer. It looks like a normal photo, so the secret must be hidden in the file itself.',
                    'Go to https://aperisolve.fr/ in your web browser.',
                    'Drag and drop the image into the Aperisolve tool or choose the file from your computer, then click Analyze and wait for the results.',
                    'Open the Identify tab and look through the metadata. Find the User Comment field, which contains a strange string: YmVhY29uX2tlZXBlcl8xOTg3',
                    'That string is Base64. Go to https://gchq.github.io/CyberChef/ and add the From Base64 operation, then paste the string as the input. The output is the password: beacon_keeper_1987',
                    'The Copyright field says the logbook is sealed, so there must be a locked file hiding inside the image. Go back to Aperisolve and open the Binwalk tab. It shows a Zip archive hidden after the end of the JPEG data.',
                    'Extract the hidden zip. Either download the extracted file from the Binwalk results, or rename last_light.jpg to last_light.zip and open it with an online unzip tool such as https://www.ezyzip.com/unzip-files-online.html',
                    'When asked for a password, enter beacon_keeper_1987 and extract the archive.',
                    'Open flag.txt. The text inside is the flag.',
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
                    'This is a Special Problem Challenge. You will need to find the hidden message in the image and submit it as a flag.',
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
                    'Look closely at the ciphertext. Some letters have been replaced with numbers.',
                    'This technique is commonly called leetspeak (1337).',
                    'Try replacing 4 with A, 0 with O, 3 with E, 7 with T, and 1 with I.',
                    'Read the decoded message and submit it using the required flag format.'
                ],
            },
            {
                id: 'crypto-2',
                name: 'Zero Knowledge One Answer',
                points: 10,
                question: 'Decode this message:\n\n01100110 01101100 01100001 01100111 01111011 01100010 00110001 01101110 00110100 01110010 01111001 01011111 01100010 00110001 01110100 01110011 01111101',
                steps: [
                    'Copy the Encrypted message.',
                    'go to https://gchq.github.io/CyberChef/',
                    'search for the operation "From Binary" and drag it to the recipe area.',
                    'Paste the Encrypted message into the input area.',
                    'Click on the "Bake!" button to decode the message.',
                    'Read the decoded message and submit it using the required flag format.'
                ],
            },
            {
                id: 'crypto-3',
                name: 'Too Common',
                points: 10,
                question: 'Hint: Only 32 People Know the Answer\n\nDecode this message:\n\nMZWGCZ33MI2HGM27GMZF6MLTL5RTA3LNGBXH2===',
                steps: [
                    'Copy the Encrypted message.',
                    'go to https://gchq.github.io/CyberChef/',
                    'search for the operation "From Base32" and drag it to the recipe area.',
                    'Paste the Encrypted message into the input area.',
                    'Click on the "Bake!" button to decode the message.',
                    'Read the decoded message and submit it using the required flag format.'
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