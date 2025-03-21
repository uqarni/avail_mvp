import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListingBuilder.css';


function ListingBuilder() {
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.bedrooms.trim() !== '' && formData.bathrooms.trim() !== '';
      case 2:
        return formData.rentPrice.trim() !== '' &&
               formData.dateAvailable.trim() !== '' &&
               formData.leaseDuration.trim() !== '';
      default:
        return true;
    }
  }
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basics
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    parkingType: 'None',

    // Terms
    rentPrice: '1500',
    securityDeposit: '0',
    dateAvailable: '',
    leaseDuration: '1 Year',
    moveInFee: '0',
    parking: '0',
    petsAllowed: false,

    // Others that would be filled in other steps
    photos: [],
    amenities: [],
    utilities: [],
    contact: {},
    title: '',
    description: '',
    showings: []
  });

  const steps = [
    { id: 1, name: 'Basics' },
    { id: 2, name: 'Terms' },
    { id: 3, name: 'Photos' },
    { id: 4, name: 'Amenities' },
    { id: 5, name: 'Utilities' },
    { id: 6, name: 'Contact' },
    { id: 7, name: 'Title & Description' },
    { id: 8, name: 'Showings' },
    { id: 9, name: 'Review & Publish' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: inputValue
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/'); // Navigate back to dashboard if on first step
    }
  };

  const renderBasicsStep = () => {
    return (
      <div className="step-content">
        <h2>Basics</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Bedrooms<span className="required">*</span></label>
            <div className="input-group">
              <i className="icon-bed"></i>
              <input
                type="text"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                placeholder="Bedrooms"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Bathrooms<span className="required">*</span></label>
            <div className="input-group">
              <i className="icon-bath"></i>
              <input
                type="text"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                placeholder="Bathrooms"
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Square Feet</label>
            <div className="input-group">
              <i className="icon-sqft"></i>
              <input
                type="text"
                name="squareFeet"
                value={formData.squareFeet}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Parking Type</label>
            <div className="input-group">
              <i className="icon-parking"></i>
              <input
                type="text"
                name="parkingType"
                value={formData.parkingType}
                onChange={handleInputChange}
                placeholder="None"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTermsStep = () => {
    return (
      <div className="step-content">
        <h2>Terms</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Rent Price (Monthly)<span className="required">*</span></label>
            <div className="input-group">
              <input
                type="text"
                name="rentPrice"
                value={formData.rentPrice}
                onChange={handleInputChange}
                placeholder="$1500"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Security Deposit</label>
            <div className="input-group">
              <input
                type="text"
                name="securityDeposit"
                value={formData.securityDeposit}
                onChange={handleInputChange}
                placeholder="$0"
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date Available<span className="required">*</span></label>
            <div className="input-group">
              <i className="icon-calendar"></i>
              <input
                type="text"
                name="dateAvailable"
                value={formData.dateAvailable}
                onChange={handleInputChange}
                placeholder="Move In"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Lease Duration<span className="required">*</span></label>
            <div className="input-group">
              <input
                type="text"
                name="leaseDuration"
                value={formData.leaseDuration}
                onChange={handleInputChange}
                placeholder="1 Year"
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Move in Fee</label>
            <div className="input-group">
              <input
                type="text"
                name="moveInFee"
                value={formData.moveInFee}
                onChange={handleInputChange}
                placeholder="$0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Parking</label>
            <div className="input-group">
              <input
                type="text"
                name="parking"
                value={formData.parking}
                onChange={handleInputChange}
                placeholder="$0"
              />
            </div>
          </div>
        </div>

        <div className="pets-option">
          <label>Pets</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="petsAllowed"
                checked={!formData.petsAllowed}
                onChange={() => setFormData({...formData, petsAllowed: false})}
              />
              <span className="radio-custom"></span>
              No Pets Allowed
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="petsAllowed"
                checked={formData.petsAllowed}
                onChange={() => setFormData({...formData, petsAllowed: true})}
              />
              <span className="radio-custom"></span>
              Pets Allowed
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaceholderStep = (stepName) => {
    return (
      <div className="step-content">
        <h2>{stepName}</h2>
        <p>This step is under development. Fields for {stepName.toLowerCase()} will be implemented here.</p>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicsStep();
      case 2:
        return renderTermsStep();
      case 3:
        return renderPlaceholderStep('Photos');
      case 4:
        return renderPlaceholderStep('Amenities');
      case 5:
        return renderPlaceholderStep('Utilities');
      case 6:
        return renderPlaceholderStep('Contact');
      case 7:
        return renderPlaceholderStep('Title & Description');
      case 8:
        return renderPlaceholderStep('Showings');
      case 9:
        return renderPlaceholderStep('Review & Publish');
      default:
        return <div>Step content not available</div>;
    }
  };

  return (
    <div className="property-app">
      <div className="listing-builder">
        <div className="listing-builder-sidebar">
          <ul className="steps-list">
            {steps.map((step) => (
              <li
                key={step.id}
                className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              >
                <span className="step-number">{step.id}</span>
                <span className="step-name">{step.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="listing-builder-content">
          {renderStepContent()}

          <div className="form-actions">
            <button className="back-button" onClick={handleBack}>
              {currentStep === 1 ? 'BACK' : 'BACK'}
            </button>
            <button
                className={`next-button ${isCurrentStepValid() ? 'enabled' : ''}`}
                onClick={handleNext}
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ListingBuilder;