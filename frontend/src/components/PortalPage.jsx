import { Container, Card } from 'react-bootstrap';

export function PortalPage({ children, className = '' }) {
  return (
    <main className={`portal-page ${className}`}>
      <Container className="py-4 py-lg-5">{children}</Container>
    </main>
  );
}

export function PortalCard({ children, className = '' }) {
  return <Card className={`portal-card border-0 shadow-sm ${className}`}>{children}</Card>;
}

export function PortalHeader({ title, subtitle, eyebrow }) {
  return (
    <header className="portal-header mb-4">
      {eyebrow && <div className="portal-eyebrow">{eyebrow}</div>}
      <h1 className="mb-2">{title}</h1>
      {subtitle && <p className="lead mb-0">{subtitle}</p>}
    </header>
  );
}
