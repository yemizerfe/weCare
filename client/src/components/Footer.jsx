function Footer() {
  return (
    <footer className="site-footer">
      <a href="/" className="brand brand--footer" aria-label="weCare home">
        <span className="brand__mark" aria-hidden="true"><span /></span>
        <span>we<span className="brand__accent">Care</span></span>
      </a>
      <p>Care, connection, and a little more ease—every day.</p>
      <span className="site-footer__copyright">&copy; {new Date().getFullYear()} weCare</span>
    </footer>
  )
}

export default Footer
