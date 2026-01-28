import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

const TermsOfServicePage = () => {
  const lastUpdated = 'January 28, 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 lg:p-12">
          <h1 className="text-3xl sm:text-4xl font-black text-navy mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
            
            {/* Agreement */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using FitMySeat ("Platform"), operated by FitMySeat Pty Ltd, you agree to be bound 
                by these Terms of Service and our <Link to="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>. 
                If you disagree with any part of these terms, you may not access the Platform.
              </p>
              <p className="mt-2">
                These Terms apply to all users including parents/guardians ("Parents"), car seat technicians 
                and businesses ("Organizations"), and their team members ("Team Members").
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 text-sm">
                <p className="font-semibold text-blue-800 mb-2">Important for EU/UK/US Users:</p>
                <p className="text-blue-700">
                  Nothing in these Terms affects your statutory rights as a consumer under applicable law, 
                  including EU Consumer Rights Directive, UK Consumer Rights Act 2015, or US state consumer 
                  protection laws. Unfair terms are not enforceable against consumers.
                </p>
              </div>
            </section>

            {/* Description */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">2. Description of Services</h2>
              <p>FitMySeat provides:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>A platform connecting parents with certified car seat technicians</li>
                <li>Booking and scheduling for car seat installation and inspection services</li>
                <li>Equipment rental services for car seats and accessories</li>
                <li>Business management tools for Organizations</li>
                <li>Communication tools between Parents and Organizations</li>
              </ul>
              <p className="mt-4 font-semibold">
                FitMySeat is a marketplace platform. We do not directly provide car seat installation services.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">3. User Accounts</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.1 Account Creation</h3>
              <p>You must:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Be at least 18 years old to create an account</li>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3.2 Account Termination</h3>
              <p>
                We may suspend or terminate accounts that violate these Terms, engage in fraud, 
                or pose safety risks. You may delete your account at any time through your settings.
              </p>
            </section>

            {/* Organizations */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">4. Organization Terms</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.1 Verification</h3>
              <p>Organizations must:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide valid business registration information</li>
                <li>Maintain appropriate certifications (e.g., CPST, Safe Kids certification)</li>
                <li>Comply with local business and safety regulations</li>
                <li>Keep insurance documentation current (where required)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.2 Service Standards</h3>
              <p>Organizations agree to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide services as described in their listings</li>
                <li>Maintain professional conduct with all clients</li>
                <li>Honor confirmed bookings (cancellation policies apply)</li>
                <li>Ensure equipment meets safety standards</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.3 Fees and Payments</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Platform fee: 3% on all transactions processed through FitMySeat</li>
                <li>Payment processing fees apply (handled by third-party processors)</li>
                <li>Payouts are processed according to your withdrawal schedule</li>
              </ul>
            </section>

            {/* Parents */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">5. Parent Terms</h2>
              <p>Parents agree to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide accurate information about children for appropriate service</li>
                <li>Attend scheduled appointments or cancel with reasonable notice</li>
                <li>Pay for services as agreed at time of booking</li>
                <li>Treat service providers with respect</li>
                <li>Comply with safety recommendations provided</li>
              </ul>
            </section>

            {/* Bookings */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">6. Bookings and Cancellations</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">6.1 Booking Confirmation</h3>
              <p>
                Bookings are confirmed once accepted by the Organization. You will receive confirmation 
                via email and in-app notification.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">6.2 Cancellation Policy</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>24+ hours notice:</strong> Full refund available</li>
                <li><strong>12-24 hours notice:</strong> 50% refund (at Organization's discretion)</li>
                <li><strong>Less than 12 hours:</strong> No refund (except emergencies)</li>
                <li>Organizations may have custom cancellation policies</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">🇪🇺🇬🇧 EU/UK Consumer Rights - Right of Withdrawal</h3>
                <p className="text-blue-700 text-sm mb-2">
                  Under the EU Consumer Rights Directive (2011/83/EU) and UK Consumer Contracts Regulations 2013:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-blue-700 text-sm">
                  <li>You have 14 days to cancel a service contract ("cooling-off period")</li>
                  <li>This right may not apply if service performance begins with your consent before the 14-day period expires</li>
                  <li>If you request service to begin immediately, you acknowledge you lose your right to cancel once the service is fully performed</li>
                  <li>For partial performance, you may owe a proportionate amount for services already provided</li>
                </ul>
                <p className="text-blue-700 text-sm mt-2">
                  <strong>To exercise withdrawal:</strong> Email support@fitmyseat.com.au stating your intention to cancel.
                </p>
              </div>
            </section>

            {/* Payments */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">7. Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payments are processed securely through third-party providers</li>
                <li>We do not store full credit card details</li>
                <li>Prices are displayed in the local currency (AUD for Australia)</li>
                <li>Additional fees (GST, service charges) are shown at checkout</li>
              </ul>
            </section>

            {/* Liability */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">8. Limitation of Liability</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                <p className="font-semibold mb-2">Important:</p>
                <p>
                  FitMySeat is a platform connecting users with service providers. We are not responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>The quality, safety, or legality of services provided by Organizations</li>
                  <li>Actions or omissions of Organizations or their Team Members</li>
                  <li>Disputes between Parents and Organizations</li>
                  <li>Equipment provided by third parties</li>
                </ul>
              </div>
              <p className="mt-4">
                To the maximum extent permitted by law, FitMySeat's liability is limited to the fees 
                you have paid to us in the 12 months preceding any claim.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">🇪🇺🇬🇧 EU/UK Consumer Protection Notice</h3>
                <p className="text-blue-700 text-sm">
                  If you are a consumer in the EU or UK, the above limitations do not affect your statutory 
                  rights. We do not exclude or limit liability for:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-blue-700 text-sm mt-2">
                  <li>Death or personal injury caused by negligence</li>
                  <li>Fraud or fraudulent misrepresentation</li>
                  <li>Breach of terms implied by consumer protection laws that cannot be excluded</li>
                  <li>Defective products under applicable product liability laws</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">🇺🇸 US Consumer Notice</h3>
                <p className="text-red-700 text-sm">
                  Some US states do not allow certain limitations of liability. If these laws apply to you, 
                  some or all of the above limitations may not apply, and you may have additional rights 
                  under your state's consumer protection laws.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless FitMySeat, its officers, directors, employees, 
                and agents from any claims, damages, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Services you provide (for Organizations)</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">10. Intellectual Property</h2>
              <p>
                The Platform, including its design, features, and content, is owned by FitMySeat and 
                protected by copyright, trademark, and other intellectual property laws. You may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Use our trademarks without authorization</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use automated systems to scrape data</li>
              </ul>
            </section>

            {/* Prohibited Conduct */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">11. Prohibited Conduct</h2>
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Use the Platform for illegal purposes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Submit false or misleading information</li>
                <li>Attempt to circumvent platform fees</li>
                <li>Interfere with the Platform's operation</li>
                <li>Create multiple accounts to avoid restrictions</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">12. Governing Law & Jurisdiction</h2>
              <p>
                These Terms are governed by the laws of New South Wales, Australia, without regard to 
                conflict of law principles.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Jurisdiction by Region</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">🇦🇺 Australian Users:</p>
                    <p className="text-gray-600">Courts of Sydney, NSW, Australia. Australian Consumer Law applies.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-700">🇪🇺 EU Users:</p>
                    <p className="text-gray-600">
                      You may bring claims in your country of residence. Mandatory consumer protection 
                      laws of your country apply. You may also use the EU Online Dispute Resolution 
                      platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">ec.europa.eu/consumers/odr</a>
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-700">🇬🇧 UK Users:</p>
                    <p className="text-gray-600">
                      You may bring claims in England and Wales, Scotland, or Northern Ireland. 
                      UK consumer protection laws apply in addition to these Terms.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-700">🇺🇸 US Users:</p>
                    <p className="text-gray-600">
                      For non-arbitrable disputes, courts in New South Wales, Australia have jurisdiction, 
                      unless your state's laws require disputes to be heard in your state. State consumer 
                      protection laws apply where mandatory.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Disputes */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">13. Dispute Resolution</h2>
              <p>
                We encourage resolving disputes informally first. Contact us at support@fitmyseat.com.au. 
                If informal resolution fails:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Mediation through an agreed mediator</li>
                <li>Arbitration under applicable rules (if agreed)</li>
                <li>Court proceedings as a last resort</li>
              </ul>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">🇪🇺 EU Online Dispute Resolution</h3>
                <p className="text-blue-700 text-sm">
                  If you are an EU consumer, you may use the European Commission's Online Dispute Resolution 
                  (ODR) platform to resolve disputes: 
                  <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline">ec.europa.eu/consumers/odr</a>
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">🇬🇧 UK Alternative Dispute Resolution</h3>
                <p className="text-indigo-700 text-sm">
                  UK consumers may refer disputes to an approved Alternative Dispute Resolution (ADR) provider. 
                  We will provide details of any applicable ADR provider when a dispute arises.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">🇺🇸 US Arbitration Notice</h3>
                <p className="text-red-700 text-sm">
                  <strong>For US users:</strong> By agreeing to these Terms, you agree that any dispute 
                  (except small claims) will be resolved by binding arbitration under the rules of the 
                  American Arbitration Association, rather than in court. 
                </p>
                <p className="text-red-700 text-sm mt-2">
                  <strong>Class action waiver:</strong> You agree to resolve disputes individually 
                  and not as part of a class, collective, or representative action.
                </p>
                <p className="text-red-700 text-sm mt-2">
                  <strong>Opt-out:</strong> You may opt out of arbitration by emailing legal@fitmyseat.com.au 
                  within 30 days of first agreeing to these Terms.
                </p>
              </div>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">14. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will notify users of material changes via 
                email or platform notification at least 30 days before they take effect. Continued 
                use after changes constitutes acceptance.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">15. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p><strong>FitMySeat Pty Ltd</strong></p>
                <p>Email: legal@fitmyseat.com.au</p>
                <p>Address: Sydney, NSW, Australia</p>
              </div>
            </section>

          </div>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="font-bold text-navy mb-4">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="text-teal-600 hover:underline font-medium">Privacy Policy →</Link>
              <Link to="/cookies" className="text-teal-600 hover:underline font-medium">Cookie Policy →</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
