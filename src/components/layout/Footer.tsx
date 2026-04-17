import { ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-deep text-white border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <img src="/images/logo-white.svg" alt="Bloomforce" className="h-7 opacity-90" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Healthcare IT talent. It&apos;s all we do. Connecting health systems with specialized IT professionals.
            </p>
          </div>

          {/* For Hiring Managers */}
          <div>
            <h4 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-primary mb-4">For Hiring Managers</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://bloomforce.com" className="hover:text-primary transition-colors">Epic / EHR Staffing</a></li>
              <li><a href="https://bloomforce.com" className="hover:text-primary transition-colors">IT Leadership Search</a></li>
              <li><a href="https://bloomforce.com" className="hover:text-primary transition-colors">Staff Augmentation</a></li>
            </ul>
          </div>

          {/* For IT Talent */}
          <div>
            <h4 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-primary mb-4">For IT Talent</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://bloomforce.com" className="hover:text-primary transition-colors">Open Positions</a></li>
              <li><a href="https://bloomforce.com" className="hover:text-primary transition-colors">Join Our Network</a></li>
            </ul>
          </div>

          {/* Insights */}
          <div>
            <h4 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-primary mb-4">Insights</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">2025 EHR Workforce Report</a></li>
              <li><a href="https://bloomforce.com" className="hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} bloomforce, LLC. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://bloomforce.com/privacy" className="text-xs text-gray-500 hover:text-gray-300">Privacy Policy</a>
            <a href="https://bloomforce.com/terms" className="text-xs text-gray-500 hover:text-gray-300">Terms</a>
            <a href="https://linkedin.com/company/bloomforcellc" className="text-gray-400 hover:text-primary transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
