import { useState } from 'react'
import Features from '../Features'
import Whoisitfor from '../whoisitfor'
import WhyLoved from '../WhyLoved'
import HeaderHome from '../HeaderHome'
import SignUp from '../SignUp'
import SignIn from '../SignIn'
import Footer from '../Footer'
import familyWithPatientsApp from '../../assets/Videos/family-with-patients-using-app-video.mp4'
import patientsUsingApp from '../../assets/Videos/patient-using-app-video.mp4'
import caregiversWithApp from '../../assets/Videos/caregivers-video.mp4'

const photos = {
    hero: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85',
    reminders: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=960&q=80',
    memories: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=960&q=80',
    location: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=960&q=80',
    caregivers: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=960&q=80',
    patient: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=960&q=80',
    family: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=960&q=80',
}

function Icon({ name, size = 22 }) {
    const shared = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    }

    const icons = {
        heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></>,
        shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
        sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
        arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    }

    return (
        <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...shared}>
            {icons[name]}
        </svg>
    )
}

function Home() {
    const [showSignupForm, setShowSignupForm] = useState(false)
    const [showSigninForm, setShowSigninForm] = useState(false)

    const openSignup = () => {
        setShowSignupForm(true)
        setShowSigninForm(false)
    }
    const openSignin = () => {
        setShowSigninForm(true)
        setShowSignupForm(false)
    }

    return (
        <div className="home-page">
            <HeaderHome onSignupClick={openSignup} onSigninClick={openSignin} />

            <main id="main">
                <section className="home-hero">
                    <div className="home-hero__inner">
                        <div className="home-hero__copy">
                            <span className="eyebrow"><span className="eyebrow__dot" /> Care that feels a little closer</span>
                            <h1>More good days,<br /><em>together.</em></h1>
                            <p className="home-hero__lead">
                                A calmer way to navigate dementia care—with gentle reminders, treasured memories, and the people who matter most, all in one place.
                            </p>
                            <div className="home-hero__actions">
                                <button type="button" className="button button--primary" onClick={openSignup}>
                                    Get started <Icon name="arrow" size={19} />
                                </button>
                                <a className="button button--quiet" href="#how-it-helps">Discover weCare</a>
                            </div>
                            <div className="home-hero__reassurance">
                                <span className="reassurance-icon"><Icon name="shield" size={18} /></span>
                                <span>Thoughtful support for the whole family</span>
                            </div>
                        </div>
                        <div className="home-hero__visual">
                            <div className="home-hero__photo-wrap">
                                <img src={photos.hero} alt="A peaceful sunrise over a green landscape" className="home-hero__photo" referrerPolicy="no-referrer" />
                            </div>
                            <div className="hero-note hero-note--top">
                                <span className="hero-note__icon"><Icon name="heart" size={20} /></span>
                                <span><strong>Here for each other</strong><small>Care is a journey we take together.</small></span>
                            </div>
                            <div className="hero-note hero-note--bottom">
                                <span className="hero-note__sun">✳</span>
                                <span><strong>One day at a time</strong><small>Small moments make a big difference.</small></span>
                            </div>
                            <div className="hero-orbit hero-orbit--one" />
                            <div className="hero-orbit hero-orbit--two" />
                        </div>
                    </div>
                    <div className="home-hero__wash" />
                </section>

                <section className="trust-strip" aria-label="Our approach">
                    <span><Icon name="heart" size={18} /> People-first care</span>
                    <span><Icon name="shield" size={18} /> Privacy with purpose</span>
                    <span><Icon name="sparkle" size={18} /> Made for everyday life</span>
                </section>

                <section className="content-section" id="how-it-helps">
                    <div className="section-heading">
                        <span className="eyebrow">A little help goes a long way</span>
                        <h2>Support for the moments<br className="desktop-break" /> that make up a day.</h2>
                        <p>Simple, thoughtful tools that help people feel more confident—and help families feel more connected.</p>
                    </div>
                    <div className="feature-grid">
                        <Features
                            icon="calendar"
                            text="Gentle reminders"
                            description="Keep daily routines familiar, with timely prompts for the things that matter."
                            image={photos.reminders}
                            alt="A person using a daily reminder"
                        />
                        <Features
                            icon="memory"
                            text="A lifetime of memories"
                            description="Bring favorite photos and stories together in a personal memory album."
                            image={photos.memories}
                            alt="A warm memory-care moment"
                        />
                        <Features
                            icon="location"
                            text="Peace of mind"
                            description="Share location with a trusted caregiver when you choose to."
                            image={photos.location}
                            alt="A location map for a caregiver"
                        />
                        <Features
                            icon="people"
                            text="Care, shared"
                            description="Make it easier for loved ones and caregivers to stay in sync."
                            image={photos.caregivers}
                            alt="Caregivers supporting one another"
                        />
                    </div>
                </section>

                <section className="people-section" id="who-its-for">
                    <div className="section-heading section-heading--left">
                        <span className="eyebrow">Care is better together</span>
                        <h2>For everyone who<br className="desktop-break" /> is part of the story.</h2>
                        <p>There’s no one way to experience dementia. weCare meets each person with warmth and practical support.</p>
                    </div>
                    <div className="people-grid">
                        <Whoisitfor
                            role="People living with dementia"
                            text="A simple, reassuring companion for everyday routines and the moments worth remembering."
                            image={photos.patient}
                            alt="A person enjoying a peaceful moment"
                        />
                        <Whoisitfor
                            role="Family caregivers"
                            text="Helpful tools to stay connected, coordinate care, and make room for more meaningful moments."
                            image={photos.caregivers}
                            alt="A caregiver spending time with a loved one"
                        />
                        <Whoisitfor
                            role="The whole family"
                            text="A shared place to feel closer, celebrate familiar stories, and support one another."
                            image={photos.family}
                            alt="Family members sharing time together"
                        />
                    </div>
                </section>

                <section className="stories-section">
                    <div className="section-heading">
                        <span className="eyebrow">Designed for real life</span>
                        <h2>Support that fits<br className="desktop-break" /> into your day.</h2>
                        <p>See how familiar, easy-to-use tools can make daily care feel a little lighter.</p>
                    </div>
                    <div className="stories-grid">
                        <WhyLoved video={patientsUsingApp} text="A little more confidence in the everyday." />
                        <WhyLoved video={familyWithPatientsApp} text="More ways to feel close, wherever you are." />
                        <WhyLoved video={caregiversWithApp} text="More support for the people who give so much." />
                    </div>
                </section>

                <section className="closing-cta">
                    <div className="closing-cta__icon"><Icon name="heart" size={26} /></div>
                    <span className="eyebrow">A gentler way forward</span>
                    <h2>Let’s make room for<br />more good moments.</h2>
                    <p>Start building a more connected care routine with weCare.</p>
                    <button type="button" className="button button--light" onClick={openSignup}>
                        Create your free account <Icon name="arrow" size={19} />
                    </button>
                </section>

                {showSignupForm && (
                    <div className="auth-backdrop" onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setShowSignupForm(false)
                    }}>
                        <SignUp onCloseClick={() => setShowSignupForm(false)} />
                    </div>
                )}

                {showSigninForm && (
                    <div className="auth-backdrop" onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setShowSigninForm(false)
                    }}>
                        <SignIn onCloseClick={() => setShowSigninForm(false)} />
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default Home
