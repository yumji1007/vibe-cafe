// 내 Supabase 프로젝트 설정 페이지에서 URL과 anon 키를 복사해 입력합니다.
const SUPABASE_URL = 'https://zybmzpvsvcnomqvnolye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5Ym16cHZzdmNub21xdm5vbHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzOTQ2NzEsImV4cCI6MjEwNjk3MDY3MX0.r3mdOYxum-L3DRFbEbCZ-pB4s2IaHLDW0ZzvGs5LsOA';

// URL과 키, Supabase 라이브러리가 준비되었을 때만 클라이언트를 만듭니다.
const supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// HTML에서 주문서와 각 입력 요소를 찾아 변수에 보관합니다.
const orderForm = document.getElementById('order-form');
const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone');
const drinkSelect = document.getElementById('drink');
const quantityInput = document.getElementById('quantity');
const estimatedPrice = document.getElementById('estimated-price');
const orderConfirmation = document.getElementById('order-confirmation');
const orderTab = document.getElementById('order-tab');
const ordersTab = document.getElementById('orders-tab');
const orderPanel = document.getElementById('order-panel');
const ordersPanel = document.getElementById('orders-panel');
const orderCount = document.getElementById('order-count');
const emptyOrdersMessage = document.getElementById('empty-orders');
const ordersList = document.getElementById('orders-list');
const ordersSummary = document.getElementById('orders-summary');
const ordersTotal = document.getElementById('orders-total');
const clearOrdersButton = document.getElementById('clear-orders');
const submitButton = orderForm.querySelector('button[type="submit"]');

// 접수된 주문을 저장하고, 새 주문 번호를 차례대로 붙입니다.
let orders = [];
let nextOrderNumber = 1;

// 선택한 음료, 사이즈, 추가 옵션과 수량을 이용해 총액을 계산합니다.
function calculateTotal() {
  // 음료를 고르지 않았다면 사이즈나 옵션과 관계없이 금액은 0원입니다.
  if (drinkSelect.value === '') {
    return 0;
  }

  // 선택한 음료 항목의 data-price 값을 기본 금액으로 사용합니다.
  const drinkPrice = Number(drinkSelect.selectedOptions[0].dataset.price);

  // 현재 선택된 사이즈 라디오 버튼의 추가 금액을 가져옵니다.
  const selectedSize = document.querySelector('input[name="size"]:checked');
  const sizePrice = selectedSize ? Number(selectedSize.dataset.price) : 0;

  // 체크된 추가 옵션들의 가격을 하나씩 더합니다.
  const selectedOptions = document.querySelectorAll('input[name="options"]:checked');
  let optionsPrice = 0;

  selectedOptions.forEach(function (option) {
    optionsPrice += Number(option.dataset.price);
  });

  // 수량이 비어 있거나 0이면 기본 수량인 1로 계산합니다.
  const quantity = Number(quantityInput.value) || 1;

  // 음료 한 잔 가격에 사이즈와 옵션 금액을 더한 뒤 수량을 곱합니다.
  return (drinkPrice + sizePrice + optionsPrice) * quantity;
}

// 계산한 금액을 천 단위 콤마와 함께 화면에 표시합니다.
function updateEstimatedPrice() {
  const total = calculateTotal();
  estimatedPrice.textContent = `예상 금액: ${total.toLocaleString()}원`;
}

// 현재 orders 배열의 내용을 주문 내역 화면에 다시 그립니다.
function renderOrders() {
  // 이전에 만든 카드들을 비우고 최신 배열 내용으로 다시 채웁니다.
  ordersList.textContent = '';
  orderCount.textContent = String(orders.length);

  // 주문이 없으면 안내 문구만 보이고 합계 영역은 숨깁니다.
  if (orders.length === 0) {
    emptyOrdersMessage.classList.remove('hidden');
    ordersSummary.classList.add('hidden');
    return;
  }

  emptyOrdersMessage.classList.add('hidden');
  ordersSummary.classList.remove('hidden');

  let totalAmount = 0;

  // 배열은 새 주문을 앞에 넣으므로 최신 주문부터 카드가 만들어집니다.
  orders.forEach(function (order) {
    totalAmount += order.amount;

    const card = document.createElement('article');
    card.className = 'order-card';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'order-card-header';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'order-card-title';
    cardTitle.textContent = `#${order.orderNumber} ${order.name}님 · ${order.amount.toLocaleString()}원`;

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'order-cancel-button';
    cancelButton.textContent = '취소';
    cancelButton.setAttribute('aria-label', `#${order.orderNumber} 주문 취소`);

    // 취소를 한 번 더 확인한 뒤 이 주문만 배열에서 삭제합니다.
    cancelButton.addEventListener('click', function () {
      const shouldCancel = confirm(`주문 #${order.orderNumber}을(를) 취소할까요?`);

      if (shouldCancel) {
        const orderIndex = orders.findIndex(function (savedOrder) {
          return savedOrder.orderNumber === order.orderNumber;
        });

        if (orderIndex !== -1) {
          orders.splice(orderIndex, 1);
          renderOrders();
        }
      }
    });

    cardHeader.append(cardTitle, cancelButton);

    const details = document.createElement('p');
    details.className = 'order-card-details';
    const optionText = order.options.length > 0
      ? ` (${order.options.join(', ')})`
      : '';
    details.textContent = `${order.drink} ${order.size}사이즈${optionText} ${order.quantity}잔`;

    const meta = document.createElement('p');
    meta.className = 'order-card-meta';

    // 요청사항은 손님이 입력한 글자이므로 textContent로 안전하게 표시합니다.
    if (order.request !== '') {
      const requestText = document.createElement('span');
      requestText.textContent = `요청사항: ${order.request}`;
      meta.append(requestText, document.createTextNode(' · '));
    }

    const orderTime = document.createElement('span');
    orderTime.textContent = `주문 시간: ${order.time}`;
    meta.append(orderTime);

    card.append(cardHeader, details, meta);
    ordersList.append(card);
  });

  // 주문 금액을 모두 더하고 주문 건수와 함께 표시합니다.
  ordersTotal.textContent = `총 주문 금액: ${totalAmount.toLocaleString()}원 (${orders.length}건)`;
}

// 선택한 탭만 활성화하고, 해당 화면 외에는 hidden 클래스로 숨깁니다.
function showTab(showOrderForm) {
  orderTab.classList.toggle('active', showOrderForm);
  ordersTab.classList.toggle('active', !showOrderForm);
  orderTab.setAttribute('aria-selected', String(showOrderForm));
  ordersTab.setAttribute('aria-selected', String(!showOrderForm));
  orderPanel.classList.toggle('hidden', !showOrderForm);
  ordersPanel.classList.toggle('hidden', showOrderForm);
}

// 두 탭 버튼을 누르면 각각 알맞은 화면을 표시합니다.
orderTab.addEventListener('click', function () {
  showTab(true);
});

ordersTab.addEventListener('click', function () {
  showTab(false);
});

// 음료, 사이즈, 추가 옵션이 바뀌면 예상 금액을 다시 계산합니다.
drinkSelect.addEventListener('change', updateEstimatedPrice);

document.querySelectorAll('input[name="size"]').forEach(function (sizeInput) {
  sizeInput.addEventListener('change', updateEstimatedPrice);
});

document.querySelectorAll('input[name="options"]').forEach(function (optionInput) {
  optionInput.addEventListener('change', updateEstimatedPrice);
});

// 수량 입력 중에도 금액이 바로 바뀌도록 input 이벤트를 사용합니다.
quantityInput.addEventListener('input', updateEstimatedPrice);

// 주문하기를 눌렀을 때 입력을 확인하고 Supabase에 주문을 저장합니다.
orderForm.addEventListener('submit', async function (event) {
  // form의 기본 제출 동작으로 페이지가 새로고침되지 않게 합니다.
  event.preventDefault();

  const customerName = customerNameInput.value.trim();

  // 이름이 비어 있으면 안내창을 띄우고 주문을 멈춥니다.
  if (customerName === '') {
    alert('이름을 입력해주세요');
    customerNameInput.focus();
    return;
  }

  // 음료를 선택하지 않았으면 안내창을 띄우고 주문을 멈춥니다.
  if (drinkSelect.value === '') {
    alert('음료를 선택해주세요');
    drinkSelect.focus();
    return;
  }

  // 현재 선택된 사이즈와 옵션 이름을 확인합니다.
  const selectedSize = document.querySelector('input[name="size"]:checked');
  const sizeName = selectedSize ? selectedSize.value : 'M';
  const selectedOptions = document.querySelectorAll('input[name="options"]:checked');
  const optionNames = [];

  selectedOptions.forEach(function (option) {
    optionNames.push(option.value);
  });

  // 선택한 옵션이 있을 때만 괄호 안에 옵션 이름을 표시합니다.
  const optionsText = optionNames.length > 0
    ? ` (${optionNames.join(', ')})`
    : '';

  const quantity = Number(quantityInput.value) || 1;
  const total = calculateTotal();
  const request = document.getElementById('request').value.trim();
  const orderTime = new Date().toLocaleString('ko-KR');
  const drinkPrice = Number(drinkSelect.selectedOptions[0].dataset.price);

  // Supabase에 보낼 열 이름을 테이블 구조와 똑같이 작성합니다.
  const orderData = {
    customer_name: customerName,
    phone: customerPhoneInput.value.trim(),
    drink: drinkSelect.value,
    drink_price: drinkPrice,
    size: sizeName,
    options: optionNames,
    quantity: quantity,
    request: request,
    total_price: total
  };

  // 저장이 끝날 때까지 주문 버튼을 잠가 중복 제출을 막습니다.
  submitButton.disabled = true;

  try {
    // 설정이 비어 있으면 실패 처리로 보내고 오류를 콘솔에 기록합니다.
    if (!supabaseClient) {
      throw new Error('script.js 맨 위에 Supabase URL과 키를 입력해주세요.');
    }

    // cafe_menu03 테이블에 주문 정보를 추가합니다.
    const { error } = await supabaseClient
      .from('cafe_menu03')
      .insert([orderData]);

    // Supabase가 오류를 돌려주면 성공 화면을 표시하지 않습니다.
    if (error) {
      throw error;
    }

    // 저장 성공 후에만 주문 내역 배열과 화면을 갱신합니다.
    const newOrder = {
      orderNumber: nextOrderNumber,
      name: customerName,
      drink: drinkSelect.value,
      size: sizeName,
      options: optionNames,
      quantity: quantity,
      request: request,
      amount: total,
      time: orderTime
    };
    orders.unshift(newOrder);
    nextOrderNumber += 1;

    // 기존 주문 확인 메시지를 표시하고 주문 내역을 다시 그립니다.
    orderConfirmation.textContent = `${customerName}님, ${drinkSelect.value} ${sizeName}사이즈${optionsText} ${quantity}잔, 총 ${total.toLocaleString()}원 주문이 접수되었습니다!`;
    orderConfirmation.hidden = false;
    renderOrders();
  } catch (error) {
    // 저장 실패 이유는 개발자가 확인할 수 있도록 콘솔에 남깁니다.
    console.error('Supabase 주문 저장 오류:', error);
    alert('주문 저장에 실패했어요');
  } finally {
    // 성공하거나 실패해도 주문 버튼을 다시 누를 수 있게 합니다.
    submitButton.disabled = false;
  }
});

// 다시 작성 버튼을 누르면 확인 메시지도 함께 지웁니다.
orderForm.addEventListener('reset', function () {
  orderConfirmation.textContent = '';
  orderConfirmation.hidden = true;

  // 브라우저가 기본 입력값(M 사이즈, 수량 1)으로 되돌린 뒤 금액을 계산합니다.
  window.setTimeout(updateEstimatedPrice, 0);
});

// 전체 내역 삭제는 확인을 거친 뒤 주문 배열을 비웁니다.
clearOrdersButton.addEventListener('click', function () {
  if (confirm('주문 내역을 모두 지울까요?')) {
    orders.length = 0;
    renderOrders();
  }
});

// 페이지를 처음 열었을 때도 현재 선택값을 기준으로 금액을 표시합니다.
updateEstimatedPrice();
renderOrders();