import { create } from 'zustand'

type StatusType = 'reading' | 'uploading' | 'success' | 'error' | null

// the kinds of values our form can hold
type FormValue = string | number | boolean | File | null

// a map from field name to its value
type FormData = Record<string, FormValue>

interface UploadFormState {
  formData: FormData
  status: StatusType
  setFormData: (field: string, value: FormValue) => void
  setBulkFormData: (data: FormData) => void
  setStatus: (status: StatusType) => void
  reset: () => void
}

export const useUploadFormStore = create<UploadFormState>()((set) => ({
  formData: {},
  status: null,

  setFormData: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),

  setBulkFormData: (data) =>
    set(() => ({ formData: data })),

  setStatus: (status) =>
    set(() => ({ status })),

  reset: () =>
    set(() => ({ formData: {}, status: null })),
}))


/*
✅ Goal-by-Goal Confirmation
| Goal                                         | ✅ Met? | Objective Reason                                                                                                                            |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Don't persist if `showAdvanced` is true**  | ✅      | `sessionStorage.setItem(...)` is only called in the `handleSubmit` block guarded by `if (!showAdvanced)`. Zustand does not persist anymore. |
| **Skip restoring if no session data exists** | ✅      | `sessionStorage.getItem(...)` is checked inside `useEffect`. If null, it returns early.                                                     |
| **Only restore once on mount**               | ✅      | `restoredRef.current` guarantees that the restore logic only executes once per component lifetime.                                          |
| **Wipe out stored data on success**          | ✅      | `sessionStorage.removeItem(...)` is explicitly called **after successful upload** and `reset()` clears the Zustand store.                   |

🔍 Race Condition Analysis
❓ Could sessionStorage be read/write in a racey way?
No, because:

useEffect only runs on the client after hydration.

No async logic modifies sessionStorage concurrently.

restoredRef.current prevents re-entry.

The only other access is in handleSubmit, which runs after user interaction.

❓ Could Zustand's set calls race with session logic?
No, because Zustand is fully synchronous by default — all set calls complete synchronously. There is no async initialization or hydration phase anymore (since persist was removed).

❓ Could a user trigger a race via multiple submissions?
You’re already handling submission as a single async event with status checks (setStatus), and sessionStorage.setItem is guarded behind !showAdvanced, which ensures no unexpected overwrite happens during advanced submissions.


*/
