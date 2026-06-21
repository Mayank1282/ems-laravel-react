import Swal from 'sweetalert2';

// Theme-aware (glassmorphism) SweetAlert2 confirm dialog.
// Returns a Promise<boolean>.
export async function confirmAction({
  title = 'Are you sure?',
  text = '',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  icon = 'warning',
  danger = false,
} = {}) {
  const isDark = document.documentElement.classList.contains('dark');

  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    buttonsStyling: false,
    background: isDark ? '#0B1022' : '#ffffff',
    color: isDark ? '#F1F5F9' : '#1e293b',
    customClass: {
      popup: 'ems-swal-popup',
      title: 'ems-swal-title',
      htmlContainer: 'ems-swal-text',
      confirmButton: danger ? 'ems-swal-confirm-danger' : 'ems-swal-confirm',
      cancelButton: 'ems-swal-cancel',
      actions: 'ems-swal-actions',
    },
  });

  return result.isConfirmed;
}

export function toastSuccess(title) {
  const isDark = document.documentElement.classList.contains('dark');
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    background: isDark ? '#0B1022' : '#ffffff',
    color: isDark ? '#F1F5F9' : '#1e293b',
  });
}
