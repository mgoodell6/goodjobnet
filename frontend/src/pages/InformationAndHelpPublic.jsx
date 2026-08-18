import { Card } from 'react-bootstrap';

function InformationAndHelpPublic({ user }) {
  return (
    <div className="help-container fade-in">
      <Card className="help-card border-0 shadow-sm">
        <h1 className="help-title">{user ? 'Help (Public)' : 'Help'}</h1>
      </Card>
    </div>
  );
}

export default InformationAndHelpPublic;
