function PageHeading({ eyebrow = 'Your weCare space', title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <span className="page-heading__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-heading__aside">{children}</div>}
    </div>
  )
}

export default PageHeading
