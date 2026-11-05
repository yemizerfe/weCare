function FeatureIcon({ name }) {
    const shared = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    }

    const icons = {
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /><path d="m9 16 2 2 4-4" /></>,
        memory: <><path d="M12 18v4M8 22h8" /><path d="M9.5 18a7 7 0 1 1 5 0" /><path d="M9 10a3 3 0 0 1 6 0c0 2-3 2-3 5" /><path d="M12 15v.1" /></>,
        location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
        people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    }

    return (
        <span className="feature-card__icon">
            <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" {...shared}>
                {icons[name]}
            </svg>
        </span>
    )
}

function Features({ image, alt = '', text, description, icon }) {
    return (
        <article className="feature-card">
            <div className="feature-card__image-wrap">
                <img src={image} alt={alt} className="feature-card__image" loading="lazy" referrerPolicy="no-referrer" />
                {icon && <FeatureIcon name={icon} />}
            </div>
            <div className="feature-card__body">
                <h3>{text}</h3>
                <p>{description}</p>
            </div>
        </article>
    )
}

export default Features
