import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

const PrivacyPolicyPage = () => {
  const lastUpdated = 'January 28, 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 lg:p-12">
          <h1 className="text-3xl sm:text-4xl font-black text-navy mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">1. Introduction</h2>
              <p>
                FitMySeat Pty Ltd ("we", "our", or "us") is committed to protecting your privacy and personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our website and services.
              </p>
              <p className="mt-2">
                We comply with applicable data protection laws including:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>European Union:</strong> General Data Protection Regulation (GDPR) 2016/679</li>
                <li><strong>United Kingdom:</strong> UK GDPR and Data Protection Act 2018</li>
                <li><strong>United States:</strong> California Consumer Privacy Act (CCPA), California Privacy Rights Act (CPRA), Virginia Consumer Data Protection Act (VCDPA), Colorado Privacy Act (CPA), Connecticut Data Privacy Act (CTDPA)</li>
                <li><strong>Australia:</strong> Privacy Act 1988 and Australian Privacy Principles (APPs)</li>
              </ul>
            </section>

            {/* Data Controller */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">2. Data Controller Information</h2>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p><strong>Data Controller:</strong> FitMySeat Pty Ltd</p>
                <p><strong>Address:</strong> Sydney, NSW, Australia</p>
                <p><strong>Email:</strong> privacy@fitmyseat.com.au</p>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">🇪🇺 EU Representative (GDPR Article 27)</h3>
              <p>For users in the European Economic Area, our EU representative is:</p>
              <div className="bg-blue-50 p-4 rounded-xl mt-2 text-sm">
                <p>FitMySeat EU Representative</p>
                <p>Email: eu-representative@fitmyseat.com.au</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">🇬🇧 UK Representative</h3>
              <p>For users in the United Kingdom, our UK representative is:</p>
              <div className="bg-blue-50 p-4 rounded-xl mt-2 text-sm">
                <p>FitMySeat UK Representative</p>
                <p>Email: uk-representative@fitmyseat.com.au</p>
              </div>
            </section>

            {/* Data We Collect */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">3. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Business name, address, certifications (for organizations)</li>
                <li><strong>Child Information:</strong> Child's name, age, weight (for car seat fitting services)</li>
                <li><strong>Payment Information:</strong> Processed securely through third-party payment processors</li>
                <li><strong>Communications:</strong> Messages, reviews, and support inquiries</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on site</li>
                <li><strong>Location Data:</strong> General location based on IP address (with consent)</li>
                <li><strong>Cookies:</strong> See our <Link to="/cookies" className="text-teal-600 hover:underline">Cookie Policy</Link></li>
              </ul>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">4. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process bookings and payments</li>
                <li>Connect parents with certified car seat technicians</li>
                <li>Send service confirmations and reminders</li>
                <li>Respond to inquiries and provide customer support</li>
                <li>Improve our services and user experience</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </section>

            {/* Legal Basis (GDPR) */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">5. Legal Basis for Processing (EU & UK GDPR)</h2>
              <p>For users in the European Economic Area (EEA) and United Kingdom, we process your data based on:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Contract (Article 6(1)(b)):</strong> To fulfill our service agreement with you</li>
                <li><strong>Consent (Article 6(1)(a)):</strong> For marketing communications and optional cookies</li>
                <li><strong>Legitimate Interest (Article 6(1)(f)):</strong> To improve services, ensure security, and prevent fraud</li>
                <li><strong>Legal Obligation (Article 6(1)(c)):</strong> To comply with applicable laws and regulations</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Special Category Data</h3>
              <p>
                We do not intentionally collect special category data (sensitive personal data such as health information, 
                racial/ethnic origin, religious beliefs). Child weight/age information is collected solely for car seat 
                fitting purposes with explicit parental consent.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">6. Information Sharing</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Service Providers:</strong> Organizations and technicians you book with</li>
                <li><strong>Payment Processors:</strong> To process secure payments</li>
                <li><strong>Analytics Providers:</strong> To understand usage patterns (anonymized)</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
              </ul>
              <p className="mt-4 font-semibold">We never sell your personal data to third parties.</p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">7. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries outside your residence, 
                including Australia and the United States. We ensure appropriate safeguards are in place:
              </p>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">🇪🇺 EU/EEA Transfers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Standard Contractual Clauses (SCCs) - EU Commission approved (2021/914)</li>
                <li>Adequacy decisions where applicable</li>
                <li>Supplementary measures as required by Schrems II decision</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">🇬🇧 UK Transfers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>UK International Data Transfer Agreement (IDTA)</li>
                <li>UK Addendum to EU SCCs</li>
                <li>UK adequacy regulations</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">🇺🇸 US Transfers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>EU-US Data Privacy Framework (where certified)</li>
                <li>Standard Contractual Clauses with US service providers</li>
                <li>Supplementary technical and organizational measures</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">8. Data Retention</h2>
              <p>We retain your data for:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Active accounts:</strong> Duration of account plus 2 years</li>
                <li><strong>Booking records:</strong> 7 years (legal/tax requirements)</li>
                <li><strong>Marketing preferences:</strong> Until you unsubscribe</li>
                <li><strong>Anonymized analytics:</strong> Indefinitely</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">9. Your Rights</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.1 All Users</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Opt-out of marketing communications</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">🇪🇺 9.2 EU GDPR Rights (EEA Users)</h3>
                <p className="text-blue-700 text-sm mb-2">Under Articles 15-22 of the GDPR, you have the right to:</p>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  <li><strong>Access (Art. 15):</strong> Obtain confirmation and copies of your data</li>
                  <li><strong>Rectification (Art. 16):</strong> Correct inaccurate personal data</li>
                  <li><strong>Erasure (Art. 17):</strong> Request deletion ("right to be forgotten")</li>
                  <li><strong>Restriction (Art. 18):</strong> Limit processing in certain circumstances</li>
                  <li><strong>Portability (Art. 20):</strong> Receive data in machine-readable format</li>
                  <li><strong>Object (Art. 21):</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Automated Decisions (Art. 22):</strong> Not be subject to solely automated decisions</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
                  <li><strong>Lodge Complaint:</strong> Complain to your local Data Protection Authority</li>
                </ul>
                <p className="text-blue-700 text-sm mt-2"><strong>Response time:</strong> Within 30 days (extendable by 60 days for complex requests)</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">🇬🇧 9.3 UK GDPR Rights (UK Users)</h3>
                <p className="text-indigo-700 text-sm mb-2">Under the UK GDPR and Data Protection Act 2018, you have equivalent rights to EU users:</p>
                <ul className="list-disc pl-6 space-y-1 text-indigo-700">
                  <li>All rights listed under EU GDPR above</li>
                  <li>Right to complain to the Information Commissioner's Office (ICO)</li>
                  <li>Right to seek judicial remedy</li>
                </ul>
                <p className="text-indigo-700 text-sm mt-2"><strong>ICO Contact:</strong> ico.org.uk | 0303 123 1113</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">🇺🇸 9.4 US Privacy Rights</h3>
                
                <p className="text-red-700 font-semibold mt-2">California (CCPA/CPRA):</p>
                <ul className="list-disc pl-6 space-y-1 text-red-700 text-sm">
                  <li><strong>Right to Know:</strong> What personal information is collected, used, and shared</li>
                  <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                  <li><strong>Right to Opt-Out:</strong> Opt out of "sale" or "sharing" of personal information</li>
                  <li><strong>Right to Correct:</strong> Correct inaccurate personal information</li>
                  <li><strong>Right to Limit:</strong> Limit use of sensitive personal information</li>
                  <li><strong>Right to Non-Discrimination:</strong> No penalty for exercising rights</li>
                </ul>
                <p className="text-red-700 text-sm mt-1"><strong>Note:</strong> We do not sell personal information.</p>
                
                <p className="text-red-700 font-semibold mt-3">Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA):</p>
                <ul className="list-disc pl-6 space-y-1 text-red-700 text-sm">
                  <li>Right to access, correct, delete, and obtain a copy of personal data</li>
                  <li>Right to opt out of targeted advertising and profiling</li>
                  <li>Right to appeal denied requests to the state Attorney General</li>
                </ul>
                
                <p className="text-red-700 text-sm mt-2"><strong>Response time:</strong> Within 45 days (extendable by 45 days)</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.5 Australian Privacy Rights</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to your personal information (APP 12)</li>
                <li>Correction of inaccurate information (APP 13)</li>
                <li>Complaint to the Office of the Australian Information Commissioner (OAIC)</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">10. Children's Privacy</h2>
              <p>
                Our services involve child safety equipment fitting. We collect limited information about 
                children (name, age, weight) solely to provide appropriate car seat recommendations and 
                installation services. This information is:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provided by parents/guardians only</li>
                <li>Used exclusively for service delivery</li>
                <li>Protected with enhanced security measures</li>
                <li>Deleted upon parent request</li>
              </ul>
              <p className="mt-2">
                We do not knowingly collect data directly from children under:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>EU/UK:</strong> 16 years (or lower if member state allows, minimum 13)</li>
                <li><strong>USA:</strong> 13 years (COPPA compliance)</li>
                <li><strong>Australia:</strong> No specific age, but parental consent required for minors</li>
              </ul>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">11. Data Security</h2>
              <p>We implement industry-standard security measures:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>SSL/TLS encryption for data in transit</li>
                <li>Encrypted database storage</li>
                <li>Row-Level Security (RLS) for data isolation</li>
                <li>Regular security audits</li>
                <li>Two-factor authentication options</li>
                <li>Secure payment processing (PCI DSS compliant)</li>
              </ul>
            </section>

            {/* Do Not Sell - CCPA */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">12. Do Not Sell My Personal Information</h2>
              <p>
                Under California law (CCPA/CPRA), you have the right to opt out of the "sale" or "sharing" 
                of your personal information. <strong>FitMySeat does not sell personal information</strong> to 
                third parties for monetary consideration. However, certain data sharing for targeted advertising 
                may be considered a "sale" under CCPA.
              </p>
              <p className="mt-2">
                To exercise your right to opt out, you can:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Adjust cookie preferences in our cookie banner (reject marketing cookies)</li>
                <li>Email us at privacy@fitmyseat.com.au with subject "Do Not Sell"</li>
                <li>Enable Global Privacy Control (GPC) in your browser</li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">13. Contact Us</h2>
              <p>For privacy-related inquiries or to exercise your rights:</p>
              <div className="bg-gray-50 p-4 rounded-xl mt-4">
                <p><strong>Data Protection Officer</strong></p>
                <p>Email: privacy@fitmyseat.com.au</p>
                <p>Mail: FitMySeat Privacy Team, Sydney, NSW, Australia</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-semibold text-blue-800">🇪🇺 EU Users</p>
                  <p className="text-blue-700">eu-representative@fitmyseat.com.au</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-sm">
                  <p className="font-semibold text-indigo-800">🇬🇧 UK Users</p>
                  <p className="text-indigo-700">uk-representative@fitmyseat.com.au</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-sm">
                  <p className="font-semibold text-red-800">🇺🇸 US Users</p>
                  <p className="text-red-700">privacy@fitmyseat.com.au</p>
                </div>
              </div>
              
              <p className="mt-4">
                <strong>Response times:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                <li>EU/UK GDPR: Within 30 days</li>
                <li>US (CCPA/CPRA): Within 45 days</li>
                <li>Australia: Within 30 days</li>
              </ul>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">14. Policy Updates</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant changes 
                via email or prominent notice on our website. Continued use of our services after changes 
                constitutes acceptance of the updated policy.
              </p>
            </section>

          </div>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="font-bold text-navy mb-4">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/terms" className="text-teal-600 hover:underline font-medium">Terms of Service →</Link>
              <Link to="/cookies" className="text-teal-600 hover:underline font-medium">Cookie Policy →</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
