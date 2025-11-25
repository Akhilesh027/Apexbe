import React from 'react';
import logo from '../Web images/logo.png'

const Footer = () => {
  return (
    <footer className="bg-footer text-white mt-auto">
      <div className="border-b border-white/10 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm">
          {/* Top Links - Responsive Wrapping */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-red-400 mb-2 md:mb-0">
            <a href="#" className="hover:underline whitespace-nowrap">About Us</a>
            <a href="#" className="hover:underline whitespace-nowrap">Partner with us</a>
            <a href="#" className="hover:underline whitespace-nowrap">Terms & Conditions</a>
            <a href="#" className="hover:underline whitespace-nowrap">Grievance policy</a>
            <a href="#" className="hover:underline whitespace-nowrap">Bug bounty</a>
            <a href="#" className="hover:underline whitespace-nowrap">Return/Cancellation policy</a>
          </div>
          {/* Language Selector */}
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <span>Language:</span>
            <div className="flex items-center gap-1 border border-white/20 px-2 py-1 rounded">
              <img src="https://flagcdn.com/w20/in.png" alt="India Flag" className="w-5 h-3" />
              <span>English</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Company Logo and Description - UPDATED with Image */}
          <div>
            <img
              src={logo}
              alt="Apexbee Logo"
              className="h-50 mb-4 rounded-lg"
            />
          
            <p className="text-sm text-white/70">
              ApexBee.in — India's growing marketplace where vendors and buyers connect for trusted shopping experiences.
            </p>
          </div>

          {/* Get to Know Us - Amazon -> Apexbee */}
          <div>
            <h3 className="font-semibold mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">About Apexbee</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Press Releases</a></li>
              <li><a href="#" className="hover:underline">Apexbee Science</a></li>
            </ul>
          </div>

          {/* Connect with Us */}
          <div>
            <h3 className="font-semibold mb-4">Connect with Us</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">Facebook</a></li>
              <li><a href="#" className="hover:underline">Twitter</a></li>
              <li><a href="#" className="hover:underline">Instagram</a></li>
            </ul>
          </div>

          {/* Make Money with Us - Company name -> Apexbee */}
          <div>
            <h3 className="font-semibold mb-4">Make Money with Us</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">Sell on Apexbee</a></li>
              <li><a href="#" className="hover:underline">Sell under Apexbee Accelerator</a></li>
              <li><a href="#" className="hover:underline">Protect and Build Your Brand</a></li>
              <li><a href="#" className="hover:underline">Apexbee Global Selling</a></li>
              <li><a href="#" className="hover:underline">Supply to Apexbee</a></li>
              <li><a href="#" className="hover:underline">Become an Affiliate</a></li>
              <li><a href="#" className="hover:underline">Fulfilment by Apexbee</a></li>
              <li><a href="#" className="hover:underline">Advertise Your Products</a></li>
            </ul>
          </div>

          {/* Let Us Help You - Company name -> Apexbee */}
          <div>
            <h3 className="font-semibold mb-4">Let Us Help You</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">Your Account</a></li>
              <li><a href="#" className="hover:underline">Returns Centre</a></li>
              <li><a href="#" className="hover:underline">Recalls and Product Safety Alerts</a></li>
              <li><a href="#" className="hover:underline">100% Purchase Protection</a></li>
              <li><a href="#" className="hover:underline">Apexbee App Download</a></li>
              <li><a href="#" className="hover:underline">Help</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar (Copyright and Payments) - Updated Company Name and Website */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-sm text-white/70">
          <div className="mb-4 md:mb-0">@2025, Apexbee.in, Inc. or its affiliates</div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span>Apexbee on Merchants</span>
            <div className="flex gap-3 bg-white rounded-lg px-4 py-2 shadow-inner">
              <span className="text-accent font-bold">UPI</span>
              <span className="text-blue-600 font-bold">PayPal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;