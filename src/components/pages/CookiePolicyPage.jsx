import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

const CookiePolicyPage = () => {
  const lastUpdated = 'January 28, 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 lg:p-12">
          <h1 className="text-3xl sm:text-4xl font-black text-navy mb-2">Cookie Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device (computer, tablet, or mobile) when you 
                visit websites. They help websites remember your preferences, understand how you use the 
                site, and improve your experience.
              </p>
              <p className="mt-2">
                This Cookie Policy explains how FitMySeat Pty Ltd ("we", "our", or "us") uses cookies and similar 
                technologies on our website and platform, in compliance with:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>EU:</strong> ePrivacy Directive (2002/58/EC as amended) and GDPR</li>
                <li><strong>UK:</strong> Privacy and Electronic Communications Regulations (PECR) and UK GDPR</li>
                <li><strong>USA:</strong> California Consumer Privacy Act (CCPA), CPRA, and state privacy laws</li>
              </ul>
            </section>

            {/* Types of Cookies */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">2. Types of Cookies We Use</h2>
              
              {/* Essential */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🔒 Essential Cookies (Required)</h3>
                <p className="text-green-700 text-sm mb-2">
                  These cookies are necessary for the website to function. They cannot be disabled.
                </p>
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="border-b border-green-200">
                      <th className="text-left py-2 text-green-800">Cookie</th>
                      <th className="text-left py-2 text-green-800">Purpose</th>
                      <th className="text-left py-2 text-green-800">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-green-700">
                    <tr className="border-b border-green-100">
                      <td className="py-2 font-mono text-xs">sb-auth-token</td>
                      <td className="py-2">User authentication</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr className="border-b border-green-100">
                      <td className="py-2 font-mono text-xs">sb-refresh-token</td>
                      <td className="py-2">Session refresh</td>
                      <td className="py-2">7 days</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">cookie_consent</td>
                      <td className="py-2">Remember your cookie preferences</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Analytics */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Analytics Cookies (Optional)</h3>
                <p className="text-blue-700 text-sm mb-2">
                  Help us understand how visitors interact with our website. You can opt out of these.
                </p>
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-2 text-blue-800">Cookie</th>
                      <th className="text-left py-2 text-blue-800">Purpose</th>
                      <th className="text-left py-2 text-blue-800">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-blue-700">
                    <tr className="border-b border-blue-100">
                      <td className="py-2 font-mono text-xs">_ga</td>
                      <td className="py-2">Google Analytics - distinguishes users</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-2 font-mono text-xs">_ga_*</td>
                      <td className="py-2">Google Analytics - session state</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">_gid</td>
                      <td className="py-2">Google Analytics - distinguishes users</td>
                      <td className="py-2">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Functional */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">⚙️ Functional Cookies (Optional)</h3>
                <p className="text-purple-700 text-sm mb-2">
                  Enable personalized features and remember your preferences.
                </p>
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="border-b border-purple-200">
                      <th className="text-left py-2 text-purple-800">Cookie</th>
                      <th className="text-left py-2 text-purple-800">Purpose</th>
                      <th className="text-left py-2 text-purple-800">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-purple-700">
                    <tr className="border-b border-purple-100">
                      <td className="py-2 font-mono text-xs">theme_preference</td>
                      <td className="py-2">Remember dark/light mode preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">recent_searches</td>
                      <td className="py-2">Store recent service/location searches</td>
                      <td className="py-2">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Marketing */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">📢 Marketing Cookies (Optional)</h3>
                <p className="text-orange-700 text-sm mb-2">
                  Used to deliver relevant advertisements. You can opt out of these.
                </p>
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="border-b border-orange-200">
                      <th className="text-left py-2 text-orange-800">Cookie</th>
                      <th className="text-left py-2 text-orange-800">Purpose</th>
                      <th className="text-left py-2 text-orange-800">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-orange-700">
                    <tr className="border-b border-orange-100">
                      <td className="py-2 font-mono text-xs">_fbp</td>
                      <td className="py-2">Facebook Pixel - ad targeting</td>
                      <td className="py-2">90 days</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">_gcl_au</td>
                      <td className="py-2">Google Ads - conversion tracking</td>
                      <td className="py-2">90 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">3. Third-Party Cookies</h2>
              <p>Some cookies are placed by third-party services that appear on our pages:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Supabase:</strong> Authentication and session management</li>
                <li><strong>Google Analytics:</strong> Website usage statistics</li>
                <li><strong>Stripe:</strong> Payment processing (PCI compliant)</li>
                <li><strong>Intercom/Support:</strong> Customer support chat (if enabled)</li>
              </ul>
              <p className="mt-4 text-sm">
                These third parties have their own privacy policies governing their use of cookies.
              </p>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">4. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.1 Our Cookie Banner</h3>
              <p>
                When you first visit our site, you'll see a cookie consent banner where you can:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Accept all cookies</li>
                <li>Accept only essential cookies</li>
                <li>Customize your preferences</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.2 Browser Settings</h3>
              <p>
                You can also control cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>View what cookies are stored</li>
                <li>Delete individual or all cookies</li>
                <li>Block third-party cookies</li>
                <li>Block all cookies (may affect functionality)</li>
              </ul>

              <div className="bg-gray-50 p-4 rounded-xl mt-4">
                <p className="font-semibold mb-2">Browser cookie settings:</p>
                <ul className="text-sm space-y-1">
                  <li>• <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Chrome</a></li>
                  <li>• <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Firefox</a></li>
                  <li>• <a href="https://support.apple.com/en-au/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Safari</a></li>
                  <li>• <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Edge</a></li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4.3 Opt-Out Links</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Google Analytics Opt-Out</a></li>
                <li><a href="https://www.facebook.com/help/568137493302217" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Facebook Ad Preferences</a></li>
                <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Digital Advertising Alliance Opt-Out</a></li>
              </ul>
            </section>

            {/* Similar Technologies */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">5. Similar Technologies</h2>
              <p>In addition to cookies, we may use:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Local Storage:</strong> Stores data in your browser for faster loading</li>
                <li><strong>Session Storage:</strong> Temporary data cleared when you close the browser</li>
                <li><strong>Pixels/Web Beacons:</strong> Small images to track email opens and page visits</li>
              </ul>
            </section>

            {/* Regional Compliance */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">6. Regional Compliance</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">🇪🇺 European Union (GDPR & ePrivacy)</h3>
                <p className="text-blue-700 mb-2">
                  Under the EU ePrivacy Directive and GDPR, we:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-blue-700 text-sm">
                  <li>Obtain <strong>explicit, informed consent</strong> before setting non-essential cookies</li>
                  <li>Provide clear information about each cookie's purpose and duration</li>
                  <li>Allow withdrawal of consent at any time through our cookie settings</li>
                  <li>Do not use cookie walls that deny service access</li>
                  <li>Store consent records for compliance documentation</li>
                </ul>
                <p className="text-blue-700 text-sm mt-2">
                  <strong>Legal basis:</strong> Consent (Art. 6(1)(a) GDPR) for non-essential cookies; 
                  Legitimate interest for strictly necessary cookies.
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">🇬🇧 United Kingdom (UK GDPR & PECR)</h3>
                <p className="text-indigo-700 mb-2">
                  Under UK GDPR and the Privacy and Electronic Communications Regulations (PECR), we:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-indigo-700 text-sm">
                  <li>Comply with the same consent requirements as EU law</li>
                  <li>Follow ICO (Information Commissioner's Office) guidance on cookies</li>
                  <li>Provide granular control over cookie categories</li>
                  <li>Ensure consent is freely given, specific, informed, and unambiguous</li>
                </ul>
                <p className="text-indigo-700 text-sm mt-2">
                  <strong>Regulatory authority:</strong> Information Commissioner's Office (ICO)
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">🇺🇸 United States</h3>
                
                <p className="text-red-700 font-semibold">California (CCPA/CPRA):</p>
                <ul className="list-disc pl-6 space-y-1 text-red-700 text-sm">
                  <li>We disclose cookie-based data collection in this policy</li>
                  <li>Analytics/advertising cookies may constitute "sale" or "sharing" under CCPA</li>
                  <li>California residents can opt out via our cookie banner or "Do Not Sell" link</li>
                  <li>We honor Global Privacy Control (GPC) signals</li>
                </ul>
                
                <p className="text-red-700 font-semibold mt-3">Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA):</p>
                <ul className="list-disc pl-6 space-y-1 text-red-700 text-sm">
                  <li>Right to opt out of targeted advertising via cookies</li>
                  <li>Right to opt out of profiling</li>
                  <li>Opt-out available through cookie preferences</li>
                </ul>
                
                <p className="text-red-700 font-semibold mt-3">Nevada, Utah, and Other States:</p>
                <p className="text-red-700 text-sm">
                  We monitor evolving state privacy laws and update our practices accordingly.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🇦🇺 Australia</h3>
                <p className="text-green-700 text-sm">
                  While Australia's Privacy Act 1988 does not require explicit cookie consent, we provide 
                  transparency and opt-out options in line with best practices and the Australian Privacy 
                  Principles (APPs). We follow guidance from the Office of the Australian Information 
                  Commissioner (OAIC).
                </p>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">7. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy periodically. Changes will be posted on this page 
                with an updated revision date. Significant changes may be communicated through a 
                renewed cookie consent prompt.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">8. Contact Us</h2>
              <p>If you have questions about our use of cookies:</p>
              <div className="bg-gray-50 p-4 rounded-xl mt-4">
                <p>Email: privacy@fitmyseat.com.au</p>
                <p>Subject: Cookie Policy Inquiry</p>
              </div>
            </section>

          </div>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="font-bold text-navy mb-4">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="text-teal-600 hover:underline font-medium">Privacy Policy →</Link>
              <Link to="/terms" className="text-teal-600 hover:underline font-medium">Terms of Service →</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicyPage;
