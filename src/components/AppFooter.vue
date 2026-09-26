<template>
  <footer class="app-footer">

    <div class="footer-left">
      <strong>ATCFPL</strong>
      <span class="separator">|</span>
      <span>Air Traffic Control Flight Plan System</span>
    </div>

    <div class="system-status">
      <span class="status-dot"></span>
      <span>SISTEMA OPERATIVO</span>
    </div>

    <div class="footer-right">
      <span>Centro de Control Mazatlán</span>
      <span class="separator">·</span>
      <strong>v1.0.0</strong>
    </div>

  </footer>
</template>

<style scoped>
.app-footer {
  width: 100%;

  height: 60px;
  min-height: 60px;

  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 30px;

  background: #06101a;

  border-top: 1px solid #17283a;

  color: #60758b;

  font-family: 'Inter', sans-serif;

  font-size: 0.8rem;
}

.footer-left,
.footer-right,
.system-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-left strong {
  color: #00e5ff;
  letter-spacing: 1px;
}

.system-status {
  color: #4fd68a;
}

.status-dot {
  width: 6px;
  height: 6px;

  background: #4fd68a;

  border-radius: 50%;

  box-shadow: 0 0 7px #4fd68a;
}

.footer-right strong {
  color: #91a4b8;
}

.separator {
  color: #29495c;
}

@media (max-width: 800px) {
  .app-footer {
    flex-direction: column;
    align-items: flex-start;

    gap: 6px;

    padding: 10px 20px;
  }
}
</style>