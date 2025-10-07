import { motion } from "framer-motion";
import { Zap, Github, Twitter, Linkedin, Mail } from "lucide-react";

interface FireForceFooterProps {
  variant?: "light" | "dark";
  className?: string;
}

export function FireForceFooter({ variant = "dark", className = "" }: FireForceFooterProps) {
  const isDark = variant === "dark";
  const textColor = isDark ? "text-white/60" : "text-gray-600";
  const textColorHover = isDark ? "hover:text-white/80" : "hover:text-gray-800";
  const bgColor = isDark ? "bg-black/20" : "bg-gray-50/90";
  const borderColor = isDark ? "border-white/10" : "border-gray-200";

  const footerLinks = {
    product: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "API", href: "#" },
    ],
    company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Status", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "GDPR", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  return (
    <motion.footer
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`border-t ${borderColor} ${bgColor} backdrop-blur-xl ${className}`}
    >
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                FireForce
              </span>
            </motion.div>
            <p className={`${textColor} text-sm mb-6 max-w-sm`}>
              Empowering innovation through cutting-edge technology. 
              Build the future with FireForce's powerful platform.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${textColor} ${textColorHover} transition-colors p-2 rounded-full hover:bg-white/10`}
                  aria-label={social.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 text-sm`}>
              Product
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a
                    href={link.href}
                    className={`${textColor} ${textColorHover} transition-colors text-sm`}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 text-sm`}>
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a
                    href={link.href}
                    className={`${textColor} ${textColorHover} transition-colors text-sm`}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 text-sm`}>
              Support
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a
                    href={link.href}
                    className={`${textColor} ${textColorHover} transition-colors text-sm`}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 text-sm`}>
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a
                    href={link.href}
                    className={`${textColor} ${textColorHover} transition-colors text-sm`}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`pt-8 border-t ${borderColor} flex flex-col md:flex-row items-center justify-between gap-4`}>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className={`${textColor} text-sm`}>
              © 2025 FireForce. All rights reserved.
            </span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <span className={`${textColor}`}>
              Made with ❤️ for innovation
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
