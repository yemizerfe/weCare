function CaregiverSection({video,text }) {
  return (
    <article className="care-story-card">
      <video loop autoPlay muted playsInline preload="metadata">
        <source src={video} type="video/mp4" />
      </video>
      <p>{text}</p>
    </article>
  )
}

export default CaregiverSection
