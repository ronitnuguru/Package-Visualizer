import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="journey-shell">
      <div className="journey-content text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg mb-8">Page not found</p>
        <Link
          to="/"
          className="slds-button slds-button_brand"
        >
          Go to Home
        </Link>
      </div>
    </main>
  );
}
