document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const msg = document.getElementById('form-msg');
  const btn = document.getElementById('submit-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
    };

    if (!data.name || !data.phone || !data.email || !data.message) {
      showMsg('Please fill in all required fields.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch(`${API_BASE}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Server error');

      showMsg("Thanks — your enquiry has been sent. We'll be in touch shortly.", 'success');
      form.reset();
    } catch (err) {
      // Backend not reachable (e.g. running the static site without the backend running yet).
      // Fall back to a pre-filled email so the enquiry isn't lost.
      const subject = encodeURIComponent(`Quote request — ${data.service || 'General enquiry'}`);
      const body = encodeURIComponent(
        `Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\nService: ${data.service || 'Not specified'}\n\nMessage:\n${data.message}`
      );
      showMsg(
        "Couldn't reach our server right now — opening your email app instead so your enquiry still reaches us.",
        'error'
      );
      window.location.href = `mailto:info@cloudcitybuilding.com?subject=${subject}&body=${body}`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Enquiry';
    }
  });

  function showMsg(text, type) {
    msg.textContent = text;
    msg.className = `form-msg show ${type}`;
  }
});
