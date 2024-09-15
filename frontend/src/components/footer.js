import React from 'react';
import './footer.css'; // Optional, for styling

const Footer = () => {
    const currentYear = new Date().getFullYear(); // Get the current year dynamically

    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {currentYear} PFM. All rights reserved.
                    <a href="/privacy-policy">Privacy Policy</a> |
                    <a href="/terms-of-service"> Terms of Service</a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;