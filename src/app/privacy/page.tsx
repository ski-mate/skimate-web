import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalDoc } from "@/components/marketing/LegalDoc";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Alpline collects, uses and protects your data, including location sharing, your privacy choices and your rights under GDPR and CCPA.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalDoc title="Alpline Privacy Policy">
          <p><strong>Last Updated: February 19, 2026</strong></p>

          <h2>Introduction</h2>
          <p>
            Welcome to Alpline. We are committed to protecting your privacy and ensuring you understand how we collect, use, and safeguard your information. This Privacy Policy explains our data practices for the Alpline mobile application and related services.
          </p>
          <p>
            Alpline is operated by EXPOMATRIX PROPERTIES LIMITED (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a company registered in England and Wales (Company Number 15639549). By using Alpline, you agree to the collection and use of information in accordance with this policy.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Information You Provide Directly</h3>
          <p><strong>Account Information:</strong></p>
          <ul>
            <li>Name and email address</li>
            <li>Profile photo (optional)</li>
            <li>Password (encrypted)</li>
            <li>Skiing ability level and preferences</li>
            <li>Emergency contact information (optional)</li>
          </ul>

          <p><strong>User-Generated Content:</strong></p>
          <ul>
            <li>Snow condition reports and reviews</li>
            <li>Photos and videos you upload</li>
            <li>Comments and social interactions</li>
            <li>Trip plans and itineraries</li>
          </ul>

          <h3>1.2 Automatically Collected Information</h3>
          <p><strong>Location Data:</strong></p>
          <ul>
            <li>Real-time GPS coordinates during active tracking sessions</li>
            <li>Altitude and elevation data</li>
            <li>Routes, trails, and runs you ski</li>
            <li>Ski resort locations you visit</li>
            <li>Location data is collected only when you are actively using the app or have background tracking enabled</li>
          </ul>

          <p><strong>Performance and Activity Data:</strong></p>
          <ul>
            <li>Speed, distance, and vertical descent</li>
            <li>Run times and session duration</li>
            <li>Heart rate data (when connected to compatible devices)</li>
            <li>Skiing technique metrics from device sensors</li>
            <li>Timestamps and activity patterns</li>
          </ul>

          <p><strong>Device Information:</strong></p>
          <ul>
            <li>Device model, operating system, and version</li>
            <li>Unique device identifiers</li>
            <li>Mobile network information</li>
            <li>App version and crash reports</li>
            <li>Device sensors data (accelerometer, gyroscope, magnetometer, barometer)</li>
          </ul>

          <p><strong>Usage Information:</strong></p>
          <ul>
            <li>Features you use and how you interact with the app</li>
            <li>In-app searches and navigation patterns</li>
            <li>Settings and preferences</li>
            <li>Error logs and performance data</li>
          </ul>

          <h3>1.3 Information from Third Parties</h3>
          <p><strong>Wearable Devices and Health Apps:</strong></p>
          <ul>
            <li>Data imported from Apple Health, Google Fit, Strava, Garmin Connect</li>
            <li>Heart rate and fitness metrics from connected devices</li>
          </ul>

          <p><strong>Social Media:</strong></p>
          <ul>
            <li>Profile information when you connect social accounts</li>
            <li>Friend lists when you authorize access</li>
          </ul>

          <p><strong>Ski Resort Partners:</strong></p>
          <ul>
            <li>Lift ticket information (with your consent)</li>
            <li>Resort service bookings you make through the app</li>
          </ul>

          <h2>2. How We Use Your Information</h2>

          <h3>2.1 Core Functionality</h3>
          <ul>
            <li>Provide real-time GPS navigation and route guidance</li>
            <li>Track and analyze your skiing performance</li>
            <li>Display your location on resort maps</li>
            <li>Calculate routes optimized for your skill level</li>
            <li>Provide audio turn-by-turn navigation instructions</li>
            <li>Enable offline map functionality</li>
          </ul>

          <h3>2.2 Social Features</h3>
          <ul>
            <li>Connect you with friends on Alpline</li>
            <li>Enable location sharing with your chosen contacts</li>
            <li>Display friend locations on maps (with consent)</li>
            <li>Facilitate group coordination and meet-ups</li>
            <li>Maintain private leaderboards among friends</li>
            <li>Support trip planning and group activities</li>
          </ul>

          <h3>2.3 Safety Features</h3>
          <ul>
            <li>Provide emergency SOS functionality</li>
            <li>Share your location with emergency services when requested</li>
            <li>Display avalanche warnings and safety alerts</li>
            <li>Enable ski patrol and emergency responder access during emergencies</li>
            <li>Provide real-time weather and condition alerts</li>
          </ul>

          <h3>2.4 Service Improvement</h3>
          <ul>
            <li>Analyze usage patterns to improve app functionality</li>
            <li>Identify and fix technical issues</li>
            <li>Develop new features based on user needs</li>
            <li>Optimize battery performance and GPS accuracy</li>
            <li>Enhance route calculation algorithms</li>
          </ul>

          <h3>2.5 Communications</h3>
          <ul>
            <li>Send you service-related notifications</li>
            <li>Provide customer support</li>
            <li>Respond to your inquiries</li>
            <li>Send important safety alerts</li>
            <li>Share feature updates (with your consent)</li>
          </ul>

          <h3>2.6 Legal Compliance</h3>
          <ul>
            <li>Comply with legal obligations</li>
            <li>Enforce our Terms of Service</li>
            <li>Protect our rights and prevent fraud</li>
            <li>Respond to legal requests from authorities</li>
          </ul>

          <h2>3. Information Sharing and Disclosure</h2>

          <h3>3.1 With Your Consent</h3>
          <p><strong>Friends and Social Connections:</strong></p>
          <ul>
            <li>Your profile information visible to accepted friends</li>
            <li>Real-time location when you enable location sharing</li>
            <li>Performance statistics on private leaderboards</li>
            <li>Trip plans when you invite participants</li>
            <li>Activity summaries you choose to share</li>
          </ul>

          <p><strong>Public Sharing:</strong></p>
          <ul>
            <li>Information you explicitly choose to make public</li>
            <li>Achievement sharing on external platforms</li>
            <li>Snow reports and reviews attributed to you</li>
          </ul>

          <h3>3.2 Service Providers</h3>
          <p>We share information with trusted third-party service providers who assist in operating Alpline:</p>
          <ul>
            <li><strong>Cloud Infrastructure:</strong> Google Cloud Platform for data storage and processing</li>
            <li><strong>Mapping Services:</strong> MapTiler for map rendering and display</li>
            <li><strong>Analytics Providers:</strong> For app performance and usage analytics</li>
            <li><strong>Customer Support:</strong> Tools for managing support requests</li>
            <li><strong>Payment Processors:</strong> For processing in-app purchases (PCI DSS compliant)</li>
          </ul>
          <p>All service providers are contractually obligated to maintain data confidentiality and security.</p>

          <h3>3.3 Ski Resort Partners</h3>
          <p>With your consent, we share limited information with ski resort partners:</p>
          <ul>
            <li>Presence at specific resorts (for operational planning)</li>
            <li>Lift ticket validation information</li>
            <li>Service bookings made through the app</li>
            <li>Aggregated, anonymized traffic patterns</li>
          </ul>

          <h3>3.4 Emergency Services</h3>
          <p>We may share your location and emergency contact information with:</p>
          <ul>
            <li>Emergency services when you activate SOS features</li>
            <li>Ski patrol during emergency situations</li>
            <li>Search and rescue operations</li>
            <li>Medical personnel responding to incidents</li>
          </ul>

          <h3>3.5 Legal Requirements</h3>
          <p>We may disclose information when required by law:</p>
          <ul>
            <li>In response to subpoenas or court orders</li>
            <li>To comply with legal processes</li>
            <li>To protect rights, property, or safety</li>
            <li>To prevent fraud or illegal activities</li>
            <li>During corporate transactions (mergers, acquisitions)</li>
          </ul>

          <h3>3.6 Aggregated Data</h3>
          <p>We may share aggregated, anonymized data that cannot identify you:</p>
          <ul>
            <li>Skiing trends and statistics</li>
            <li>Popular routes and trail usage</li>
            <li>Crowd density patterns for resorts</li>
            <li>General performance benchmarks</li>
            <li>Research and development purposes</li>
          </ul>

          <h2>4. Your Privacy Choices and Controls</h2>

          <h3>4.1 Location Sharing Controls</h3>
          <p><strong>Granular Location Management:</strong></p>
          <ul>
            <li>Toggle GPS tracking on/off at any time</li>
            <li>Control who can see your real-time location</li>
            <li>Set location sharing expiration times</li>
            <li>Disable background location updates</li>
            <li>Choose between &ldquo;while using app&rdquo; or &ldquo;always&rdquo; location access</li>
          </ul>

          <p><strong>Friend Location Sharing:</strong></p>
          <ul>
            <li>Accept or decline individual location sharing requests</li>
            <li>Create temporary location sharing for specific trips</li>
            <li>Revoke location access from specific friends anytime</li>
            <li>Control visibility of your past routes and activities</li>
          </ul>

          <h3>4.2 Social and Visibility Settings</h3>
          <p><strong>Profile Privacy:</strong></p>
          <ul>
            <li>Set profile to private or friends-only</li>
            <li>Control what information is visible to others</li>
            <li>Manage friend requests and connections</li>
            <li>Opt out of leaderboards entirely</li>
            <li>Hide specific activities or sessions</li>
          </ul>

          <p><strong>Communication Preferences:</strong></p>
          <ul>
            <li>Manage push notification settings</li>
            <li>Control email communications</li>
            <li>Set do-not-disturb periods</li>
            <li>Customize alert types and frequency</li>
          </ul>

          <h3>4.3 Data Access and Portability</h3>
          <p><strong>Access Your Data:</strong></p>
          <ul>
            <li>Request a copy of all your personal information</li>
            <li>Review collected location and performance data</li>
            <li>Download your activity history</li>
          </ul>

          <p><strong>Export Your Data:</strong></p>
          <ul>
            <li>Export activities in standard formats (GPX, TCX, CSV)</li>
            <li>Transfer data to other fitness platforms</li>
            <li>Backup your complete activity history</li>
          </ul>

          <h3>4.4 Data Deletion</h3>
          <p><strong>Delete Specific Data:</strong></p>
          <ul>
            <li>Remove individual activities or sessions</li>
            <li>Delete uploaded photos and content</li>
            <li>Clear specific location history</li>
          </ul>

          <p><strong>Account Deletion:</strong></p>
          <ul>
            <li>Request complete account deletion</li>
            <li>All personal data removed within 30 days</li>
            <li>Some data may be retained for legal compliance</li>
            <li>Shared data visible to friends will be anonymized</li>
          </ul>

          <h2>5. Data Security</h2>

          <h3>5.1 Security Measures</h3>
          <p><strong>Encryption:</strong></p>
          <ul>
            <li>AES-256 encryption for data at rest</li>
            <li>TLS/SSL encryption for data in transit</li>
            <li>End-to-end encryption for emergency communications</li>
            <li>Encrypted storage of location data</li>
          </ul>

          <p><strong>Access Controls:</strong></p>
          <ul>
            <li>Multi-factor authentication support</li>
            <li>Role-based access to internal systems</li>
            <li>Regular security audits and penetration testing</li>
            <li>Employee security training and background checks</li>
          </ul>

          <p><strong>Infrastructure Security:</strong></p>
          <ul>
            <li>Secure cloud infrastructure (Google Cloud Platform)</li>
            <li>Regular security patches and updates</li>
            <li>Distributed denial-of-service (DDoS) protection</li>
            <li>Continuous monitoring and threat detection</li>
          </ul>

          <p><strong>Data Minimization:</strong></p>
          <ul>
            <li>Collect only necessary information</li>
            <li>Regular review of data retention</li>
            <li>Automatic deletion of expired location shares</li>
            <li>Anonymous processing where possible</li>
          </ul>

          <h3>5.2 Your Responsibility</h3>
          <p>Help protect your account:</p>
          <ul>
            <li>Use a strong, unique password</li>
            <li>Enable two-factor authentication</li>
            <li>Don&apos;t share account credentials</li>
            <li>Log out on shared devices</li>
            <li>Report suspicious activity immediately</li>
            <li>Keep your app updated</li>
          </ul>

          <h3>5.3 Breach Notification</h3>
          <p>In the unlikely event of a data breach:</p>
          <ul>
            <li>We will notify affected users within 72 hours</li>
            <li>Provide details about the incident</li>
            <li>Explain steps we&apos;re taking to address it</li>
            <li>Offer guidance on protecting your information</li>
            <li>Notify relevant authorities as required by law</li>
          </ul>

          <h2>6. Data Retention</h2>

          <h3>6.1 Active Account Data</h3>
          <p><strong>While Your Account is Active:</strong></p>
          <ul>
            <li>Location and activity data: Retained indefinitely unless you delete it</li>
            <li>Profile information: Retained until you update or delete it</li>
            <li>Social connections: Maintained until you remove friends</li>
            <li>Performance statistics: Stored for historical tracking</li>
          </ul>

          <h3>6.2 Deletion and Retention Periods</h3>
          <p><strong>After Account Deletion:</strong></p>
          <ul>
            <li>Most personal data deleted within 30 days</li>
            <li>Some data retained for legal compliance (up to 7 years)</li>
            <li>Aggregated, anonymized data may be retained indefinitely</li>
            <li>Backups purged within 90 days</li>
          </ul>

          <p><strong>Automatic Deletion:</strong></p>
          <ul>
            <li>Temporary location shares expire automatically</li>
            <li>Expired trip plans removed after 30 days</li>
            <li>Crash logs and diagnostics after 90 days</li>
            <li>Inactive accounts may be deleted after 3 years of inactivity (with notice)</li>
          </ul>

          <h3>6.3 Legal and Safety Retention</h3>
          <p>Some information retained longer for:</p>
          <ul>
            <li>Legal and regulatory compliance</li>
            <li>Fraud prevention and security</li>
            <li>Resolving disputes</li>
            <li>Enforcing agreements</li>
            <li>Emergency response records</li>
          </ul>

          <h2>7. Children&apos;s Privacy</h2>

          <h3>7.1 Age Requirements</h3>
          <p>Alpline is not intended for children under 13 years of age. We do not knowingly collect information from children under 13.</p>

          <h3>7.2 Parental Consent</h3>
          <p>Users aged 13-17 must have parental consent to use Alpline. Parents can:</p>
          <ul>
            <li>Monitor their child&apos;s account usage</li>
            <li>Control privacy settings</li>
            <li>Manage location sharing permissions</li>
            <li>Access activity data</li>
            <li>Request account deletion</li>
          </ul>

          <h3>7.3 Discovery and Deletion</h3>
          <p>If we discover we have collected information from a child under 13:</p>
          <ul>
            <li>We will delete the information promptly</li>
            <li>We will terminate the account</li>
            <li>We will notify parents if identifiable</li>
            <li>We will not use the information for any purpose</li>
          </ul>

          <h2>8. International Data Transfers</h2>

          <h3>8.1 Data Location</h3>
          <p>Alpline operates globally. Your information may be:</p>
          <ul>
            <li>Stored on servers in the United States</li>
            <li>Processed in countries where we or our service providers operate</li>
            <li>Transferred across international borders</li>
          </ul>

          <h3>8.2 Legal Protections</h3>
          <p>For international transfers, we ensure:</p>
          <ul>
            <li>Adequate data protection through standard contractual clauses</li>
            <li>Compliance with EU-US Data Privacy Framework principles</li>
            <li>GDPR compliance for European users</li>
            <li>Appropriate safeguards for cross-border transfers</li>
          </ul>

          <h3>8.3 Regional Rights</h3>
          <p>Depending on your location, you may have additional rights:</p>
          <ul>
            <li><strong>EU/EEA:</strong> GDPR rights including data portability and erasure</li>
            <li><strong>California:</strong> CCPA rights including disclosure and deletion</li>
            <li><strong>Canada:</strong> PIPEDA rights for access and correction</li>
            <li><strong>UK:</strong> UK GDPR protections and rights</li>
          </ul>

          <h2>9. Your Legal Rights</h2>

          <h3>9.1 General Rights</h3>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request copies of your personal information</li>
            <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Objection:</strong> Object to certain processing activities</li>
            <li><strong>Restriction:</strong> Limit how we use your information</li>
            <li><strong>Withdrawal:</strong> Withdraw consent at any time</li>
          </ul>

          <h3>9.2 GDPR Rights (EU/EEA/UK Users)</h3>
          <p>Additional rights under GDPR and the UK Data Protection Act 2018:</p>
          <ul>
            <li>Right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) in the UK or your local supervisory authority in the EU/EEA</li>
            <li>Right to object to automated decision-making</li>
            <li>Right to data portability across services</li>
            <li>Right to be informed about data breaches</li>
            <li>Enhanced consent requirements</li>
          </ul>

          <h3>9.3 CCPA Rights (California Users)</h3>
          <p>California residents have rights to:</p>
          <ul>
            <li>Know what personal information is collected</li>
            <li>Know whether information is sold or disclosed</li>
            <li>Opt-out of sale of personal information (we don&apos;t sell data)</li>
            <li>Access collected information</li>
            <li>Request deletion of information</li>
            <li>Non-discrimination for exercising rights</li>
          </ul>

          <h3>9.4 Exercising Your Rights</h3>
          <p>To exercise these rights:</p>
          <ul>
            <li>Email: privacy@getalpline.com</li>
            <li>In-app: Settings &gt; Privacy &gt; Data Rights</li>
            <li>Response time: Within 30 days</li>
            <li>Verification: We may request identity confirmation</li>
            <li>No fee: Generally free (except excessive requests)</li>
          </ul>

          <h2>10. Third-Party Services</h2>

          <h3>10.1 Integrated Services</h3>
          <p><strong>Health and Fitness:</strong> Apple Health, Google Fit, Strava, Garmin Connect</p>
          <p><strong>Social Media:</strong> Authentication and sharing platforms (subject to their own privacy policies)</p>
          <p><strong>Wearable Devices:</strong> Apple Watch, Garmin devices, compatible heart rate monitors</p>
          <p><strong>Payment Services:</strong> In-app purchase platforms (PCI DSS compliant processors)</p>

          <h3>10.2 Third-Party Links</h3>
          <p>Our app may contain links to external websites and services. We are not responsible for their privacy practices. Review their policies before providing information.</p>

          <h3>10.3 Your Consent to Third-Party Sharing</h3>
          <p>When you connect third-party services:</p>
          <ul>
            <li>You authorize data sharing between platforms</li>
            <li>Review each service&apos;s privacy policy</li>
            <li>You can disconnect services anytime</li>
            <li>Some data may persist on third-party platforms after disconnection</li>
          </ul>

          <h2>11. Cookies and Tracking Technologies</h2>

          <h3>11.1 Technologies We Use</h3>
          <p><strong>Mobile Analytics:</strong> App performance tracking, crash reporting, usage analytics, feature adoption metrics</p>
          <p><strong>Session Management:</strong> Authentication tokens, user preferences, temporary data storage</p>
          <p><strong>Advertising:</strong> We currently do not use advertising trackers. This section will be updated if we introduce ads.</p>

          <h3>11.2 Your Choices</h3>
          <p>Control tracking through:</p>
          <ul>
            <li>Device settings (Limit Ad Tracking on iOS, Opt out of Ads Personalization on Android)</li>
            <li>App settings for analytics</li>
            <li>Declining optional tracking permissions</li>
          </ul>

          <h2>12. Changes to This Privacy Policy</h2>

          <h3>12.1 Updates</h3>
          <p>We may update this Privacy Policy periodically to reflect changes in our practices, legal or regulatory requirements, new features or services, and user feedback.</p>

          <h3>12.2 Notification</h3>
          <p>When we make changes:</p>
          <ul>
            <li>Material changes: We&apos;ll notify you via email and in-app notification</li>
            <li>Minor changes: Posted with updated &ldquo;Last Updated&rdquo; date</li>
            <li>Continued use constitutes acceptance of changes</li>
            <li>Review regularly for updates</li>
          </ul>

          <h3>12.3 Previous Versions</h3>
          <p>We maintain an archive of previous policy versions available upon request.</p>

          <h2>13. Contact Us</h2>

          <h3>13.1 Privacy Questions</h3>
          <p>For privacy-related questions or concerns:</p>
          <p><strong>Email:</strong> privacy@getalpline.com</p>
          <p>
            <strong>Mail:</strong><br />
            EXPOMATRIX PROPERTIES LIMITED<br />
            Privacy Department<br />
            23 Tiggall Close<br />
            Reading, RG6 7ES<br />
            United Kingdom
          </p>
          <p><strong>In-App:</strong> Settings &gt; Help &amp; Support &gt; Privacy</p>

          <h3>13.2 Data Protection Officer</h3>
          <p>For GDPR-related inquiries: <strong>dpo@getalpline.com</strong></p>

          <h3>13.3 Response Time</h3>
          <ul>
            <li>General questions: 5 business days</li>
            <li>Data rights requests: 30 days</li>
            <li>Emergency situations: 24 hours</li>
          </ul>

          <h2>14. Regional-Specific Information</h2>

          <h3>14.1 European Union/EEA</h3>
          <p><strong>Legal Basis for Processing:</strong></p>
          <ul>
            <li>Contract performance: Providing app services</li>
            <li>Legitimate interests: Service improvement and security</li>
            <li>Consent: Marketing and optional features</li>
            <li>Legal obligations: Compliance requirements</li>
          </ul>

          <p><strong>Supervisory Authority:</strong></p>
          <ul>
            <li><strong>UK Users:</strong> You can lodge complaints with the Information Commissioner&apos;s Office (ICO) at ico.org.uk</li>
            <li><strong>EU/EEA Users:</strong> You can lodge complaints with your local data protection authority</li>
          </ul>

          <p><strong>Representative:</strong> EU Representative: Varniethan Ketheeswaran — Email: dpo@getalpline.com</p>

          <h3>14.2 California</h3>
          <p><strong>CCPA Disclosures:</strong></p>
          <ul>
            <li>We do not sell personal information</li>
            <li>We have not sold information in the past 12 months</li>
            <li>Categories of information collected: See Section 1</li>
            <li>Purposes for collection: See Section 2</li>
            <li>Categories of sources: Direct user input, automatic collection, third parties</li>
          </ul>

          <h3>14.3 Canada</h3>
          <p><strong>PIPEDA Compliance:</strong> Appropriate consent for all collection, limited collection to stated purposes, accuracy and security safeguards, transparency about policies, individual access to information.</p>

          <h3>14.4 Australia</h3>
          <p><strong>Privacy Act 1988 Compliance:</strong> Australian Privacy Principles adherence, cross-border disclosure protections, complaint handling process, Office of the Australian Information Commissioner notification rights.</p>

          <h2>15. Additional Terms</h2>

          <h3>15.1 No Medical Advice</h3>
          <p>Alpline is not a medical device. Performance and heart rate data is for informational purposes only and should not replace professional medical advice.</p>

          <h3>15.2 Safety Disclaimer</h3>
          <p>While we provide safety features and emergency services integration, Alpline is a navigation tool, not a substitute for proper safety equipment, skiing training and knowledge, weather awareness and judgment, resort safety guidelines, or professional emergency services.</p>

          <h3>15.3 Accuracy Disclaimer</h3>
          <p>We strive for accuracy but cannot guarantee GPS location precision in all conditions, real-time availability of resort data, completeness of trail information, weather forecast accuracy, or performance metric precision.</p>

          <h3>15.4 Beta Features</h3>
          <p>Some features may be offered in beta: may have limited functionality, subject to change or removal, additional data collection for testing, separate consent may be required.</p>

          <hr />

          <p><strong>By using Alpline, you acknowledge that you have read, understood, and agree to this Privacy Policy.</strong></p>
          <p>For the most current version of this policy, please check within the app or visit our website.</p>
          <p><strong>Effective Date:</strong> February 19, 2026 | <strong>Version:</strong> 1.0</p>
    </LegalDoc>
  );
}
