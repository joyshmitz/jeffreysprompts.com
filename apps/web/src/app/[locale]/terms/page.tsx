import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for JeffreysPrompts.com - Read our terms and conditions for using our prompt library and services.",
};

const tableOfContents = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "description", title: "2. Description of Service" },
  { id: "accounts", title: "3. User Accounts" },
  { id: "subscription", title: "4. Subscription and Billing" },
  { id: "content", title: "5. User Content and Ownership" },
  { id: "prohibited", title: "6. Prohibited Conduct" },
  { id: "intellectual-property", title: "7. Intellectual Property" },
  { id: "disclaimer", title: "8. Disclaimer of Warranties" },
  { id: "limitation", title: "9. Limitation of Liability" },
  { id: "termination", title: "10. Termination" },
  { id: "governing-law", title: "11. Governing Law" },
  { id: "contact", title: "12. Contact Information" },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="January 11, 2026"
      version="1.0"
      icon="terms"
      tableOfContents={tableOfContents}
    >
      <p className="lead">
        Welcome to JeffreysPrompts.com. By accessing or using our service, you agree to be bound by
        these Terms of Service. Please read them carefully.
      </p>

      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>
        By accessing or using JeffreysPrompts.com (the &quot;Service&quot;), you agree to be bound by these
        Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use
        the Service.
      </p>
      <p>
        We may update these Terms from time to time. We will notify you of any material changes by
        posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use
        of the Service after any changes constitutes acceptance of the new Terms.
      </p>

      <h2 id="description">2. Description of Service</h2>
      <p>
        JeffreysPrompts.com provides a curated library of prompts for AI coding agents, including:
      </p>
      <ul>
        <li>A free, open-source collection of battle-tested prompts</li>
        <li>Tools to browse, search, and copy prompts</li>
        <li>CLI tools for programmatic access</li>
        <li>Optional premium features for enhanced functionality</li>
      </ul>
      <p>
        The core prompt library is free and open-source. Premium features may be offered for a
        subscription fee.
      </p>

      <h2 id="accounts">3. User Accounts</h2>
      <p>
        Some features of the Service may require you to create an account. When you create an
        account, you agree to:
      </p>
      <ul>
        <li>Provide accurate and complete information</li>
        <li>Maintain the security of your account credentials</li>
        <li>Notify us immediately of any unauthorized access</li>
        <li>Accept responsibility for all activities under your account</li>
      </ul>
      <p>
        We use Google OAuth for authentication. By creating an account, you authorize us to access
        your basic profile information (name and email) from Google.
      </p>

      <h2 id="subscription">4. Subscription and Billing</h2>
      <h3>Free Tier</h3>
      <p>
        The core prompt library and browsing experience are free and will remain free. No credit
        card is required for the free tier.
      </p>
      <h3>Premium Subscription</h3>
      <p>
        Premium features are available for a monthly or annual subscription fee. By subscribing,
        you agree to:
      </p>
      <ul>
        <li>Pay the applicable subscription fees</li>
        <li>Authorize recurring charges until you cancel</li>
        <li>Accept that fees are non-refundable except as required by law</li>
      </ul>
      <p>
        You may cancel your subscription at any time. Cancellation takes effect at the end of your
        current billing period.
      </p>

      <h2 id="content">5. User Content and Ownership</h2>
      <h3>Your Content</h3>
      <p>
        You retain ownership of any prompts, notes, or other content you create on the Service
        (&quot;User Content&quot;). By submitting User Content, you grant us a license to store, display, and
        process it as necessary to provide the Service.
      </p>
      <h3>Community Contributions</h3>
      <p>
        If you submit prompts for inclusion in the public library, you grant us a perpetual,
        worldwide, royalty-free license to use, modify, and distribute your contribution. You
        represent that you have the right to grant this license.
      </p>
      <h3>Our Content</h3>
      <p>
        The curated prompts in our library are provided under the MIT License. You may use them
        freely in your projects, subject to the license terms.
      </p>

      <h2 id="prohibited">6. Prohibited Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any illegal purpose</li>
        <li>Submit content that infringes intellectual property rights</li>
        <li>Attempt to gain unauthorized access to the Service</li>
        <li>Interfere with or disrupt the Service</li>
        <li>Submit spam, malware, or harmful content</li>
        <li>Scrape or harvest data without permission</li>
        <li>Impersonate others or misrepresent your affiliation</li>
        <li>Use the Service to develop competing products</li>
      </ul>

      <h2 id="intellectual-property">7. Intellectual Property</h2>
      <p>
        The Service, excluding User Content and open-source components, is owned by Jeffrey Emanuel
        and is protected by copyright, trademark, and other intellectual property laws.
      </p>
      <p>
        &quot;JeffreysPrompts&quot; and our logo are trademarks. You may not use them without our prior
        written consent.
      </p>

      <h2 id="disclaimer">8. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER
        EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
      </p>
      <p>
        We do not warrant that the Service will be uninterrupted, secure, or error-free. Prompts
        are provided for informational purposes and may not be suitable for all use cases.
      </p>

      <h2 id="limitation">9. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
        REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
      </p>
      <p>
        OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED
        THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS
        GREATER.
      </p>

      <h2 id="termination">10. Termination</h2>
      <p>
        We may terminate or suspend your access to the Service at any time, with or without cause,
        with or without notice. Upon termination:
      </p>
      <ul>
        <li>Your right to use the Service will immediately cease</li>
        <li>We may delete your account and User Content</li>
        <li>Provisions that by their nature should survive will remain in effect</li>
      </ul>

      <h2 id="governing-law">11. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the State of
        Delaware, United States, without regard to its conflict of law provisions.
      </p>
      <p>
        Any disputes arising from these Terms or the Service shall be resolved exclusively in the
        state or federal courts located in Delaware.
      </p>

      <h2 id="contact">12. Contact Information</h2>
      <p>
        If you have any questions about these Terms, please contact us at:
      </p>
      <ul>
        <li>
          Email:{" "}
          <a href="mailto:legal@jeffreysprompts.com">legal@jeffreysprompts.com</a>
        </li>
        <li>
          GitHub:{" "}
          <a
            href="https://github.com/Dicklesworthstone/jeffreysprompts.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/Dicklesworthstone/jeffreysprompts.com
          </a>
        </li>
        <li>
          Twitter:{" "}
          <a
            href="https://twitter.com/doodlestein"
            target="_blank"
            rel="noopener noreferrer"
          >
            @doodlestein
          </a>
        </li>
      </ul>
    </LegalPageLayout>
  );
}
