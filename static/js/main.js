function hideAllWells() {
    let allWells = document.querySelectorAll('.setup-content');
    allWells.forEach(function(el) { el.classList.add('d-none'); });
}

var stripe = Stripe('pk_test_g6do5S237ekq10r65BnxO6S0');
var elements = stripe.elements();

var style = {
    base: {
      color: '#32325d',
    //   lineHeight: '18px',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  };
var card = elements.create('card', {style});
card.addEventListener('change', function(event) {
    const displayError = document.getElementById('card-errors');
    displayError.textContent = event.error ? event.error.message : '';
});
  
document.addEventListener('DOMContentLoaded', function() {
    hideAllWells();

    card.mount('#card-element');
    
    let activeSelector = document.location.hash || '.setup-content';
    document.querySelector(document.location.hash).classList.remove('d-none');
});

document.addEventListener('click', function(evt) {
    console.log('click', evt.target);

    const stepAnchor = evt.target.closest('a[href^="#"].step');
    if (stepAnchor) {
        hideAllWells();
        const well = document.querySelector(stepAnchor.hash);
        well.classList.remove('d-none');

        history.pushState({}, '', stepAnchor.hash);
    }

    evt.preventDefault();
}, false);
