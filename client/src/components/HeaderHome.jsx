function HeaderHome({ onSignupClick,onSigninClick }) {
    return (
        <header className="site-header">
            <nav aria-label="Main navigation" className="site-header__inner">
                <a href="#main" className="brand" aria-label="weCare home">
                    <span className="brand__mark" aria-hidden="true"><span /></span>
                    <span>we<span className="brand__accent">Care</span></span>
                </a>
                <div className="site-header__links">
                    <a className="site-header__link" href="#how-it-helps">How it helps</a>
                    <a className="site-header__link" href="#who-its-for">Who it’s for</a>
                </div>
                <div className="site-header__actions">
                    <button type="button" className="site-header__signin" onClick={onSigninClick}>Sign in</button>
                    <button type="button" className="button button--small" onClick={onSignupClick}>Get started</button>
                </div>
            </nav>
        </header>
    )
}

export default HeaderHome
