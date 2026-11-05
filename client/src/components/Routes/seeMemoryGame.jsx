import MemoryGame from '../MemoryGame'
import HeaderPatient from '../HeaderPatient'
import Footer from '../Footer'
import PageHeading from '../PageHeading'

function SeeMemoryGame() {
    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading eyebrow="Play a little, feel a little brighter" title="Memory match" description="A cheerful little game. Find the matching pairs at your own pace." />
                <MemoryGame />
            </main>
            <Footer />
        </div>
    )
}

export default SeeMemoryGame
