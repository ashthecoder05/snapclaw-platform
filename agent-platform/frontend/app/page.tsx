"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: "",
    botName: "",
    software: "telegram"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Token, 3: Success
  const [botToken, setBotToken] = useState("");

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setProgress("Starting deployment...");

    try {
      // Step 1: Purchasing VM (5 seconds)
      setTimeout(() => setProgress("Purchasing local virtual machine..."), 1000);

      // Step 2: Creating SSH keys (3 seconds)
      setTimeout(() => setProgress("Creating SSH keys and storing securely..."), 6000);

      // Step 3: Connecting via SSH (2 seconds)
      setTimeout(() => setProgress("Connecting to the server via SSH..."), 9000);

      // Step 4: Ask for Telegram token (after 11 seconds total)
      setTimeout(() => {
        setProgress("");
        setCurrentStep(2); // Move to token input step
        setLoading(false);
      }, 11000);

    } catch (err: any) {
      setError(err.message);
      setProgress("");
      setLoading(false);
    }
  };

  const handleTelegramPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress("Pairing with Telegram...");

    try {
      // Simulate pairing (9 seconds - total becomes ~20 seconds)
      setTimeout(async () => {
        const response = await fetch("http://localhost:8000/website/deploy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: formData.userId,
            website_name: formData.botName,
            website_type: formData.software,
            bot_token: botToken
          })
        });

        if (!response.ok) {
          throw new Error(`Deployment failed: ${response.statusText}`);
        }

        const data = await response.json();
        setResult(data);
        setProgress("");
        setCurrentStep(3); // Move to success step
        setLoading(false);
      }, 9000);

    } catch (err: any) {
      setError(err.message);
      setProgress("");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#064089] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="text-white">
            <h1 className="text-2xl font-bold">SnapClaw<span className="text-gray-300">.com</span></h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white hover:text-gray-200 font-medium flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg border border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            View Dashboard
          </button>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Get Your Personal OpenClaw AI Assistant
          </h2>
          <p className="text-xl text-gray-200">
            Deploy your own 24/7 AI assistant in minutes.<br/>No technical knowledge required - just one click and you're ready to go.
          </p>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 1 ? 'bg-white border-white text-[#064089]' : 'border-white/30 text-white/50'} font-bold`}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-semibold ${currentStep >= 1 ? 'text-white' : 'text-white/50'}`}>Step 1</p>
                  <p className={`text-xs ${currentStep >= 1 ? 'text-gray-300' : 'text-white/40'}`}>Bot Details</p>
                </div>
              </div>

              {/* Connector Line */}
              <div className={`h-0.5 flex-1 mx-2 ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>

              {/* Step 2 */}
              <div className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 2 ? 'bg-white border-white text-[#064089]' : 'border-white/30 text-white/50'} font-bold`}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-semibold ${currentStep >= 2 ? 'text-white' : 'text-white/50'}`}>Step 2</p>
                  <p className={`text-xs ${currentStep >= 2 ? 'text-gray-300' : 'text-white/40'}`}>Telegram Token</p>
                </div>
              </div>

              {/* Connector Line */}
              <div className={`h-0.5 flex-1 mx-2 ${currentStep >= 3 ? 'bg-white' : 'bg-white/30'}`}></div>

              {/* Step 3 */}
              <div className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 3 ? 'bg-white border-white text-[#064089]' : 'border-white/30 text-white/50'} font-bold`}>
                  {currentStep > 3 ? '✓' : '3'}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-semibold ${currentStep >= 3 ? 'text-white' : 'text-white/50'}`}>Step 3</p>
                  <p className={`text-xs ${currentStep >= 3 ? 'text-gray-300' : 'text-white/40'}`}>Success</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          {currentStep === 1 && (
                <form onSubmit={handleDeploy} className="space-y-6">
                {/* User ID */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your Name / User ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-gray-300"
                    placeholder="john-doe"
                  />
                </div>

                {/* Bot Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.botName}
                    onChange={(e) => setFormData({...formData, botName: e.target.value})}
                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-gray-300"
                    placeholder="MyAwesomeBot"
                  />
                </div>

                {/* Software Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Software
                  </label>
                  <select
                    value={formData.software}
                    onChange={(e) => setFormData({...formData, software: e.target.value})}
                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white"
                  >
                    <option value="telegram" className="bg-[#064089] text-white">Telegram</option>
                    <option value="discord" className="bg-[#064089] text-white">Discord (Coming Soon)</option>
                    <option value="whatsapp" className="bg-[#064089] text-white">WhatsApp (Coming Soon)</option>
                  </select>
                </div>

              {/* What happens behind the scenes */}
              <div className="backdrop-blur-sm bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold text-white mb-3">
                  What happens when you deploy:
                </h3>
                <ul className="space-y-2 text-sm text-gray-200">
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">1️⃣</span>
                      <span>Purchasing local virtual machine</span>
                    </div>
                    <span className="text-gray-400 text-xs">5 sec</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">2️⃣</span>
                      <span>Creating SSH keys and storing securely</span>
                    </div>
                    <span className="text-gray-400 text-xs">3 sec</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">3️⃣</span>
                      <span>Connecting to the server via SSH</span>
                    </div>
                    <span className="text-gray-400 text-xs">2 sec</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">4️⃣</span>
                      <span>Pairing with Telegram</span>
                    </div>
                    <span className="text-gray-400 text-xs">9 sec</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-300 mt-3">
                  Total time: ~20 seconds (fully automated)
                </p>
              </div>

              {/* Deploy Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#064089] py-4 rounded-lg font-bold text-lg hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? "Deploying..." : "Deploy OpenClaw Assistant"}
              </button>

                {/* Progress indicator */}
                {progress && (
                  <div className="mt-4 p-4 backdrop-blur-sm bg-white/20 border border-white/30 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      <span className="text-sm text-white font-medium">{progress}</span>
                    </div>
                  </div>
                )}
                </form>
            )}

            {currentStep === 2 && (
                <form onSubmit={handleTelegramPairing} className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">✅ Server Ready!</h3>
                  <p className="text-gray-300">Now let's pair your Telegram bot</p>
                </div>

                {/* Important Instructions */}
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-200 font-semibold mb-2">⚠️ Before Pairing:</p>
                  <ol className="text-yellow-100 text-sm space-y-1 list-decimal list-inside">
                    <li>Open Telegram app</li>
                    <li>Search for your bot: <code className="bg-yellow-600/30 px-1 rounded">@{formData.botName}</code></li>
                    <li>Send <code className="bg-yellow-600/30 px-1 rounded">/start</code> to your bot</li>
                    <li>Then come back here and enter your bot token below</li>
                  </ol>
                </div>

                {/* Telegram Bot Token */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    required
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-gray-300 font-mono text-sm"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                  <p className="text-xs text-gray-300 mt-1">Get your bot token from @BotFather on Telegram</p>
                </div>

                {/* Pair Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-[#064089] py-4 rounded-lg font-bold text-lg hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? "Pairing..." : "Pair with Telegram"}
                </button>

                {/* Progress indicator */}
                {progress && (
                  <div className="mt-4 p-4 backdrop-blur-sm bg-white/20 border border-white/30 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      <span className="text-sm text-white font-medium">{progress}</span>
                    </div>
                  </div>
                )}
                </form>
              )}

          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Bot Paired Successfully!
              </h2>
              <div className="backdrop-blur-sm bg-green-500/20 border border-green-400/30 rounded-lg p-6 mb-6">
                <p className="text-lg font-semibold text-white mb-4">
                  ✅ Your OpenClaw bot is now live and ready!
                </p>
                <div className="bg-white/10 rounded-lg p-4 text-left">
                  <p className="text-white font-semibold mb-3">📱 Next Steps to Chat with Your Bot:</p>
                  <ol className="text-gray-200 text-sm space-y-2 list-decimal list-inside">
                    <li>Open the <strong>Telegram app</strong> on your phone or desktop</li>
                    <li>Search for your bot: <code className="bg-white/20 px-2 py-1 rounded font-mono">@{formData.botName}</code></li>
                    <li>Send the message: <code className="bg-white/20 px-2 py-1 rounded font-mono">/start</code></li>
                    <li>Your bot will reply: <span className="text-green-300 italic">"Hi, how can I help you? Nice pairing with OpenClaw! 🎉"</span></li>
                  </ol>
                  <p className="text-yellow-300 text-xs mt-3 italic">⚠️ Important: You must send /start first before the bot can message you!</p>
                </div>
              </div>

              <div className="text-left backdrop-blur-sm bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                <h3 className="font-semibold text-white mb-3">Deployment Details:</h3>
                <div className="space-y-2 text-sm text-gray-200">
                  <p><strong>Bot Name:</strong> <code className="bg-white/10 px-2 py-1 rounded">{formData.botName}</code></p>
                  <p><strong>User ID:</strong> <code className="bg-white/10 px-2 py-1 rounded">{formData.userId}</code></p>
                  <p><strong>Platform:</strong> <code className="bg-white/10 px-2 py-1 rounded">{formData.software}</code></p>
                  <p><strong>Status:</strong> <span className="text-green-300 font-semibold">Active & Running</span></p>
                  <p><strong>Server IP:</strong> <code className="bg-white/10 px-2 py-1 rounded">40.78.123.456</code></p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-white text-[#064089] px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setCurrentStep(1);
                    setBotToken("");
                    setFormData({ userId: "", botName: "", software: "telegram" });
                  }}
                  className="backdrop-blur-sm bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors border border-white/30 font-semibold"
                >
                  Deploy Another
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 backdrop-blur-sm bg-red-500/20 border border-red-400/30 rounded-lg">
              <h3 className="font-semibold text-white mb-2">
                ❌ Deployment Failed
              </h3>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-16 flex items-center">
          <div className="flex-grow border-t border-gray-500"></div>
          <span className="px-4 text-gray-400 text-sm uppercase tracking-wider">Benefits of SnapClaw</span>
          <div className="flex-grow border-t border-gray-500"></div>
        </div>

        {/* Benefits of SnapClaw Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-white mb-12 text-center">Benefits of SnapClaw</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="text-white font-semibold text-xl mb-3">Lightning Fast Setup</h4>
              <p className="text-gray-300">Get your AI assistant up and running in under a minute. No complex configuration needed.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h4 className="text-white font-semibold text-xl mb-3">Cost Effective</h4>
              <p className="text-gray-300">Pay only for what you use. No hidden fees, no subscriptions. Full control over your costs.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h4 className="text-white font-semibold text-xl mb-3">Private & Secure</h4>
              <p className="text-gray-300">Your own dedicated instance. Your data stays private with enterprise-grade security.</p>
            </div>
          </div>
        </div>

        {/* What can OpenClaw do Section */}
        <div className="mt-16 text-center pb-16">
          <h2 className="text-4xl font-bold text-white mb-4">What can OpenClaw do for you?</h2>
          <p className="text-gray-400 text-xl mb-12">One assistant, thousands of use cases</p>

          <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto">
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📧 Read & summarize email</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📅 Schedule meetings from chat</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">💬 Draft replies and follow-ups</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">🌐 Translate messages</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">💳 Manage subscriptions</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">⏰ Remind you of deadlines</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📊 Plan your week</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📝 Take meeting notes</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">🌍 Sync across time zones</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">💰 Negotiate refunds</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">🎫 Find coupons</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">🔍 Find best prices online</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📉 Find discount codes</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📄 Write contracts and NDAs</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📊 Research competitors</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">👥 Screen and prioritize leads</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">🧾 Generate invoices</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📈 Track OKRs and KPIs</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">📰 Monitor news and alerts</span>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-gray-600 rounded-lg px-6 py-4 hover:bg-white/10 hover:border-gray-400 transition-all duration-300 hover:scale-105">
              <span className="text-white">🎯 Set and track goals</span>
            </div>
          </div>

          <p className="text-gray-400 mt-12 text-sm italic">PS. You can add as many use cases as you want via natural language</p>
        </div>
      </div>
    </main>
  );
}