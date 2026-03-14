# 🔔 Migration: alert() → Toast Sonner

## Setup (sudah selesai)
```bash
npx shadcn@latest add sonner
```

---

## Step 1: layout.tsx

Tambah import dan `<Toaster />` di root layout:

```tsx
// src/app/layout.tsx
import { Toaster } from "@/components/ui/sonner";

// Di dalam return, sebelum </body>:
<ThemeProvider ...>
  {children}
  <Toaster richColors position="top-right" />
</ThemeProvider>
```

---

## Step 2: accounts-list.tsx

```tsx
// Tambah import
import { toast } from "sonner";

// handleCreate — ganti alert + tambah success
async function handleCreate(formData: FormData) {
  const rawBalance = formData.get("balance") as string;
  if (rawBalance) formData.set("balance", rawBalance.replace(/\./g, ""));

  const result = await createAccount(formData);
  if (result?.error) {
    toast.error(result.error);
    return;
  }
  setDialogOpen(false);
  toast.success("Akun berhasil ditambahkan");
  router.refresh();
}

// handleUpdate — ganti alert + tambah success
async function handleUpdate(formData: FormData) {
  if (!editingAccount) return;
  const result = await updateAccount(editingAccount.id, formData);
  if (result?.error) {
    toast.error(result.error);
    return;
  }
  setEditingAccount(null);
  toast.success("Akun berhasil diupdate");
  router.refresh();
}

// handleDelete — ganti confirm + alert
async function handleDelete(id: string) {
  toast("Hapus akun ini?", {
    action: {
      label: "Hapus",
      onClick: async () => {
        const result = await deleteAccount(id);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Akun berhasil dihapus");
        router.refresh();
      },
    },
    cancel: {
      label: "Batal",
      onClick: () => {},
    },
  });
}
```

---

## Step 3: categories-list.tsx

```tsx
// Tambah import
import { toast } from "sonner";

// handleCreate
async function handleCreate(formData: FormData) {
  const result = await createCategory(formData);
  if (result?.error) {
    toast.error(result.error);
    return;
  }
  setDialogOpen(false);
  toast.success("Kategori berhasil ditambahkan");
  router.refresh();
}

// handleUpdate
async function handleUpdate(formData: FormData) {
  if (!editingCategory) return;
  const result = await updateCategory(editingCategory.id, formData);
  if (result?.error) {
    toast.error(result.error);
    return;
  }
  setEditingCategory(null);
  toast.success("Kategori berhasil diupdate");
  router.refresh();
}

// handleDelete — ganti confirm + alert
async function handleDelete(id: string) {
  toast("Hapus kategori ini?", {
    action: {
      label: "Hapus",
      onClick: async () => {
        const result = await deleteCategory(id);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Kategori berhasil dihapus");
        router.refresh();
      },
    },
    cancel: {
      label: "Batal",
      onClick: () => {},
    },
  });
}
```

---

## Step 4: transactions-list.tsx

```tsx
// Tambah import
import { toast } from "sonner";

// handleCreate
async function handleCreate(formData: FormData) {
  const result = await createTransaction(formData);
  if (result?.error) {
    toast.error(result.error);
    return;
  }
  setDialogOpen(false);
  toast.success("Transaksi berhasil ditambahkan");
  router.refresh();
}

// handleDelete — ganti confirm + alert
async function handleDelete(id: string) {
  toast("Hapus transaksi ini?", {
    action: {
      label: "Hapus",
      onClick: async () => {
        const result = await deleteTransaction(id);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Transaksi berhasil dihapus");
        router.refresh();
      },
    },
    cancel: {
      label: "Batal",
      onClick: () => {},
    },
  });
}
```

---

## Checklist

- [ ] `layout.tsx` — tambah `<Toaster />`
- [ ] `accounts-list.tsx` — ganti semua `alert()` dan `confirm()`
- [ ] `categories-list.tsx` — ganti semua `alert()` dan `confirm()`
- [ ] `transactions-list.tsx` — ganti semua `alert()` dan `confirm()`
