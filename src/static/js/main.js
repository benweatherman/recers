const STRIPE = Stripe('pk_test_g6do5S237ekq10r65BnxO6S0');
const style = {
    base: {
      fontSize: '16px',
    },
  };
const CARD_ELEMENT = STRIPE.elements().create('card', {style});

document.addEventListener('DOMContentLoaded', function() {
    setupStepButtons()
    setupPreviousButton();
    setupNextButton();

    setupPlayers();
    setupStripe();

    setupAnswerSaving();
    
    setPageFromID(document.location.hash || '#step-start');
    render();
});

const data = {
    team: {
        name: null,
        colors: null,
    },
    division: null,
    contact: {
        name: null,
        phone: null,
        email: null,
    },
    coach: null,
    assistantCoach: null,
    players: [],
    payment: {
        token: null,
    },
};

const state = {
    currentPage: 0,
    pages: [
        {contentID: 'step-start'},
        {contentID: 'step-team'},
        {contentID: 'step-payment'},
        {contentID: 'step-confirmation'},
    ],
    isLastPage() {
        return this.currentPage === this.pages.length - 1
    },
    isFirstPage() {
        return this.currentPage === 0;
    },
};

function setCardError(msg) {
    const errorEl = document.getElementById('card-errors');

    if (msg && msg.length) {
        errorEl.textContent = msg;
        errorEl.classList.remove('d-none');
    }
    else {
        errorEl.textContent = '';
        errorEl.classList.add('d-none');
    }
}

function setupStripe() {    
    CARD_ELEMENT.addEventListener('change', (evt) => {
        const msg = evt.error ? evt.error.message : null;
        setCardError(msg);
    });

    CARD_ELEMENT.mount('#card-element');
}

function setupStepButtons() {
    var buttons = document.querySelectorAll('a.step');
    buttons.forEach(function(button) {
        button.addEventListener('click', handleStepClick);
    });
}

function handleStepClick(evt) {
    evt.preventDefault();

    setPageFromID(this.hash);
    render();
}

function setupPreviousButton() {
    var button = document.querySelector('button.previous');
    button.addEventListener('click', (evt) => {
        state.currentPage -= 1;
        render();
    });
}

function setupNextButton() {
    var button = document.querySelector('button.next');
    button.addEventListener('click', handleNextClick);
}

async function handleNextClick(evt) {
    if (state.isLastPage()) {
        return;
    }

    evt.preventDefault();
    if (state.currentPage === 2) {
        const loader = this.querySelector('.loader');
        loader.style.visibility = 'visible';

        setCardError(null);

        const result = await STRIPE.createToken(CARD_ELEMENT);

        if (result.error) {
            setCardError(result.error.message);
        }
        else {
            data.payment.token = result.token;
            state.currentPage += 1;
            render();
        }
        loader.style.visibility = 'hidden';
    }
    else {
        state.currentPage += 1;
        render();
    }
}

function setupPlayers() {
    const button = document.getElementById('jsAddPlayer');
    const tableBody = document.getElementById('jsPlayersBody');
    const tableRow = tableBody.querySelector('tr');
    const row = tableRow.cloneNode(true);

    const addRow = () => {
        const newRow = row.cloneNode(true);
        const currentRowCount = tableBody.querySelectorAll('tr').length;

        // Fixup IDs so they're unique
        newRow.querySelectorAll('[id^="player"]').forEach((el) => {
            el.id = el.id.replace(/player\d+/, `player${currentRowCount + 1}`);
        });

        newRow.querySelectorAll('[data-storage-key]').forEach((el) => {
            el.dataset.storageKey = el.dataset.storageKey.replace(/players\.\d+/, `players.${currentRowCount}`);
            el.addEventListener('change', handleAnswer);
            el.addEventListener('blur', handleAnswer);
        });

        tableBody.appendChild(newRow);

        return newRow;
    };

    button.addEventListener('click', (evt) => {
        evt.preventDefault();

        const newRow = addRow();
        newRow.querySelector('input').focus();
    });

    tableRow.remove();
    for (let i = 0; i < 5; i++) {
        addRow();
    }
}

function setupAnswerSaving() {
    document.querySelectorAll('[data-storage-key]').forEach((el) => {
        el.addEventListener('change', handleAnswer);
        el.addEventListener('blur', handleAnswer);
    });
}

function handleAnswer(evt) {
    const key = evt.target.dataset.storageKey;
    const val = evt.target.value;
    console.log(`data[${key}] = ${val}`);
    _.set(data, key, val);
}

function setPageFromID(id) {
    const pageID = _.trimStart(id, '#');
    state.currentPage = state.pages.findIndex((pageInfo) => pageID === pageInfo.contentID);

    console.log(`Set currentPage=${state.currentPage} from ${id}`);
}

function render() {
    const activeSelector = `#${state.pages[state.currentPage].contentID}`;
    console.log(`Rendering active page ${activeSelector}`);
    document.querySelector(activeSelector).classList.remove('d-none');

    let hiddenSections = document.querySelectorAll(`.setup-content:not(${activeSelector}`);
    hiddenSections.forEach((el) => el.classList.add('d-none'));

    document.querySelector('button.previous').classList.toggle('d-none', state.isFirstPage());

    const button = document.querySelector('button.next');
    if (state.isLastPage()) {
        button.querySelector('.text').textContent = 'Submit';
        button.type = 'submit';
    }
    else {
        button.querySelector('.text').textContent = 'Next';
        button.type = 'button';
    }

    document.querySelector('#jsPaymentToken').value = data.payment.token;

    history.pushState({}, '', activeSelector);
}
