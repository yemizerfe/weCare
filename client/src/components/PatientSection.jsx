function PatientSection({image, alt, text}) {
  return (
    <article className="patient-highlight">
      <img src={image} alt={alt || text} loading="lazy" referrerPolicy="no-referrer" />
      <p>{text}</p>
    </article>
  )
}

export default PatientSection
