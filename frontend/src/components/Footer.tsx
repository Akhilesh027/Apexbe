import { Link } from "react-router-dom";
import logo from '../Web images/Web images/logo.png';

const Footer = () => {
  return (
    <footer className="bg-navy-dark text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <div className="border-2 border-white rounded-lg p-4 inline-block mb-4">
              <img src={logo} alt="Company Logo" className="w-32 h-auto" />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonu
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Get to Know Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/about" className="hover:text-accent">About Amazon</Link></li>
              <li><Link to="/careers" className="hover:text-accent">Careers</Link></li>
              <li><Link to="/press" className="hover:text-accent">Press Releases</Link></li>
              <li><Link to="/amazon-science" className="hover:text-accent">Amazon Science</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect with Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="#" className="hover:text-accent">Facebook</Link></li>
              <li><Link to="#" className="hover:text-accent">Twitter</Link></li>
              <li><Link to="#" className="hover:text-accent">Instagram</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Make Money with Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="#" className="hover:text-accent">Sell on company name</Link></li>
              <li><Link to="#" className="hover:text-accent">Sell under Company Accelerator</Link></li>
              <li><Link to="#" className="hover:text-accent">Protect and Build Your Brand</Link></li>
              <li><Link to="#" className="hover:text-accent">Company Name Global Selling</Link></li>
              <li><Link to="#" className="hover:text-accent">Supply to Company name</Link></li>
              <li><Link to="#" className="hover:text-accent">Become an Affiliate</Link></li>
              <li><Link to="#" className="hover:text-accent">Fulfilment by Company name</Link></li>
              <li><Link to="#" className="hover:text-accent">Advertise Your Products</Link></li>
              <li><Link to="#" className="hover:text-accent">Company name on Merchants</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Let Us Help You</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/account" className="hover:text-accent">Your Account</Link></li>
              <li><Link to="#" className="hover:text-accent">Returns Centre</Link></li>
              <li><Link to="#" className="hover:text-accent">Recalls and Product Safety Alerts</Link></li>
              <li><Link to="#" className="hover:text-accent">100% Purchase Protection</Link></li>
              <li><Link to="#" className="hover:text-accent">Company name App Download</Link></li>
              <li><Link to="#" className="hover:text-accent">Help</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-light mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">@2025 Companyname.com, Inc. or its affiliates</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-white rounded px-3 py-1">
              <span className="text-navy font-semibold text-sm">UPI</span>
            </div>
            <div className="bg-white rounded px-3 py-1">
              <span className="text-blue-600 font-semibold text-sm">PayPal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-light">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 justify-center text-xs text-accent">
            <Link to="/about" className="hover:underline">About Us</Link>
            <Link to="/partner" className="hover:underline">Partner with us</Link>
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
            <Link to="/media" className="hover:underline">Media</Link>
            <Link to="/grievance" className="hover:underline">Grievance policy</Link>
            <Link to="/bug-bounty" className="hover:underline">Bug bounty</Link>
            <Link to="/return-cancellation" className="hover:underline">Return/Cancellation policy</Link>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-white">Language:</span>
              <span className="flex items-center gap-1">
                🇮🇳 <span className="text-white">English</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
