import React, { useState } from 'react';
import logo from './img/marketflow-logo.png';
import { withTailwindCSS } from '../../Utils/hooks';

const InvestorRelations = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    countryCode: ''
  });
  const [formError, setFormError] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFormSubmit = async () => {
    if (!formData.firstName || !formData.phone || !formData.countryCode) {
      setFormError('All fields are required except "Company".');
      setSubmissionStatus('error');
      return;
    }

    setIsSubmitting(true);

    // Remove leading zero from phone number if present
    const formattedPhone = formData.phone.startsWith('0') 
      ? formData.phone.slice(1) 
      : formData.phone;

    const payload = {
      companyName: formData.company || '',
      emailAddress: '', // Not required
      externalNetwork: 'WHATSAPP',
      firstName: formData.firstName,
      lastName: formData.lastName,
      onboarderEmailAddress: 'investorrelations@marketflowllc.com',
      phoneNumber: `${formData.countryCode}${formattedPhone}`,
      advisorSymphonyIds: null,
      advisorEmailAddresses: null
    };

    console.log('Payload:', payload); // Log the payload for debugging
    
    try {
      const response = await fetch('https://poc.symphonymarket.solutions/onboard_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setFormError('');
        setSubmissionStatus('success');
      } else {
        setFormError('Failed to submit the form. Please try again.');
        setSubmissionStatus('error');
      }
    } catch (error) {
      setFormError('An error occurred. Please check your network and try again.');
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }

    // Keep the modal open briefly to show the status
    setTimeout(() => {
      setShowForm(false);
      setSubmissionStatus(null);
    }, 3000);
  };

  const openForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
      countryCode: ''
    });
    setFormError('');
    setShowForm(true);
    setSubmissionStatus(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto py-10 px-4">
        <div className="text-center">
          <p className="text-lg text-gray-400 mt-2">Key insights and resources for Market Flow investors.</p>
        </div>
        <div className="mt-10">
          <img src={logo} alt="Investor Relations" className="mx-auto rounded-md shadow-lg max-w-xs" />
        </div>
        <div className="mt-10 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-400">Company Overview</h2>
            <p className="mt-4 text-gray-400">
              Market Flow is a leading innovator in content distribution technology, leveraging advanced networks to connect users and businesses in real time. Founded in 2020, Market Flow has rapidly expanded its global footprint with partnerships spanning finance, tech, and media sectors.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-400">Key Financial Highlights</h2>
            <ul className="mt-4 space-y-2 text-gray-400 list-disc pl-5">
              <li>2023 Revenue: $150M (30% YoY growth)</li>
              <li>Net Income: $25M</li>
              <li>Global User Base: 1.2M active users</li>
              <li>Partnerships with 200+ leading organizations</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-400">Contact Investor Relations</h2>
            <button
              onClick={openForm}
              className="mt-4 bg-green-500 text-white py-2 px-4 rounded-full flex items-center space-x-2 hover:bg-green-600 transition-colors duration-200"
            >
              <i className="fab fa-whatsapp"></i>
              <span>Contact via WhatsApp</span>
            </button>
            {showForm && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90">
                <div className="bg-gray-700 p-6 rounded-md shadow-lg max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">Contact via WhatsApp</h3>
                  <div className="space-y-4">
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    {submissionStatus === 'success' && <p className="text-green-500 text-sm">Form submitted successfully!</p>}
                    <div>
                      <label className="block text-gray-400">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        className="w-full border rounded-md p-2 mt-1 bg-gray-800 text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        className="w-full border rounded-md p-2 mt-1 bg-gray-800 text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400">Company (Optional)</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        className="w-full border rounded-md p-2 mt-1 bg-gray-800 text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400">Phone Number</label>
                      <div className="flex space-x-2">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleFormChange}
                          disabled={isSubmitting}
                          className="border rounded-md p-2 bg-gray-800 text-gray-300"
                        >
                          <option value="">Select Country Code</option>
                          <option value="+1">+1 (USA)</option>
                          <option value="+33">+33 (France)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+91">+91 (India)</option>
                        </select>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          disabled={isSubmitting}
                          className="flex-grow border rounded-md p-2 bg-gray-800 text-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    {isSubmitting && (
                      <div className="flex items-center space-x-2">
                        <i className="fab fa-whatsapp animate-spin text-green-500"></i>
                        <span className="text-gray-400">Submitting...</span>
                      </div>
                    )}
                    {!isSubmitting && (
                      <button
                        onClick={() => setShowForm(false)}
                        className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleFormSubmit}
                      disabled={isSubmitting}
                      className={`bg-green-500 text-white py-2 px-4 rounded-md transition-colors duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <footer className="bg-gray-800 py-4 mt-10">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          &copy; 2025 Market Flow. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default withTailwindCSS(InvestorRelations);