function whoisitfor({ image,role, text, alt }) {
    return (
        <article className="person-card">
            <img src={image} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
            <div className="person-card__copy">
                <h3>{role}</h3>
                <p>{text}</p>
            </div>
        </article>
    )
}

export default whoisitfor
