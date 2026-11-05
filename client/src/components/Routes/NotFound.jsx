import { Link } from 'react-router-dom'

function NotFound() {
    return (
        <div className="app-page not-found">
            <div className="not-found__card">
                <span className="app-brand__mark" aria-hidden="true">w</span>
                <span className="page-heading__eyebrow">PAGE NOT FOUND</span>
                <h1>We could not find that page</h1>
                <p>The link may have changed, or the page may have been moved. You can always return to your care space.</p>
                <div className="not-found__actions">
                    <Link to="/" className="app-button app-button--primary">Go to the home page</Link>
                    <Link to="/patient" className="app-button app-button--secondary">Patient home</Link>
                    <Link to="/caregiver" className="app-button app-button--secondary">Caregiver home</Link>
                </div>
            </div>
        </div>
    )
}

export default NotFound
