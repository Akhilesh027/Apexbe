const Footer = () => {
  return (
    <footer className="bg-footer text-white mt-auto">
      <div className="border-b border-white/10 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-red-400">
          <div className="flex gap-6">
            <a href="#" className="hover:underline">About Us</a>
            <a href="#" className="hover:underline">Partner with us</a>
            <a href="#" className="hover:underline">Terms & Conditions Media</a>
            <a href="#" className="hover:underline">Grievance policy</a>
            <a href="#" className="hover:underline">Bug bounty</a>
            <a href="#" className="hover:underline">Return/Cancellation policy</a>
          </div>
          <div className="flex items-center gap-2">
            <span>Language:</span>
            <div className="flex items-center gap-1 border border-white/20 px-2 py-1 rounded">
              <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 h-3" />
              <span>English</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div>
            <div className="border-2 border-white/30 rounded px-4 py-2 inline-block mb-4">
              <div className="text-2xl font-bold">Logo</div>
              <div className="text-xs">E commerce</div>
            </div>
            <p className="text-sm text-white/70">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonu
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">About Amazon</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Press Releases</a></li>
              <li><a href="#" className="hover:underline">Amazon Science</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Connect with Us</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">Facebook</a></li>
              <li><a href="#" className="hover:underline">Twitter</a></li>
              <li><a href="#" className="hover:underline">Instagram</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Make Money with Us</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">Sell on company name</a></li>
              <li><a href="#" className="hover:underline">Sell under Company Accelerator</a></li>
              <li><a href="#" className="hover:underline">Protect and Build Your Brand</a></li>
              <li><a href="#" className="hover:underline">Company Name Global Selling</a></li>
              <li><a href="#" className="hover:underline">Supply to Company name</a></li>
              <li><a href="#" className="hover:underline">Become an Affiliate</a></li>
              <li><a href="#" className="hover:underline">Fulfilment by Company name</a></li>
              <li><a href="#" className="hover:underline">Advertise Your Products</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Let Us Help You</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:underline">Your Account</a></li>
              <li><a href="#" className="hover:underline">Returns Centre</a></li>
              <li><a href="#" className="hover:underline">Recalls and Product Safety Alerts</a></li>
              <li><a href="#" className="hover:underline">100% Purchase Protection</a></li>
              <li><a href="#" className="hover:underline">Company name App Download</a></li>
              <li><a href="#" className="hover:underline">Help</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-sm text-white/70">
          <div>@2025, Companyname.com, Inc. or its affiliates</div>
          <div className="flex items-center gap-4">
            <span>Company name on Merchants</span>
            <div className="flex gap-3 bg-white rounded px-4 py-2">
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
