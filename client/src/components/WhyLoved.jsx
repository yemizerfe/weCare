function WhyLoved({video, text}) {
  return (
    <article className="story-card">
      <video loop autoPlay muted playsInline preload="metadata" aria-label={text}>
        <source src={video} type="video/mp4" />
      </video>
      <p>{text}</p>
    </article>
  )
}

export default WhyLoved
