"use client"

import { useActionState } from "react"
import { Lock, Shield, AlertCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loginFamily, type LoginState } from "@/actions/family-auth"

interface FamilyLoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const initialState: LoginState = { error: null }

export function FamilyLoginDialog({ open, onOpenChange, onSuccess }: FamilyLoginDialogProps) {
  const [state, formAction, pending] = useActionState(async (prev: LoginState, formData: FormData) => {
    const result = await loginFamily(prev, formData)
    if (!result.error) {
      onSuccess()
      onOpenChange(false)
    }
    return result
  }, initialState)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <span>Acesso da Família</span>
          </DialogTitle>
        </DialogHeader>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Digite a senha combinada em família para publicar fotos ou remover conteúdo.
          </AlertDescription>
        </Alert>
        <form action={formAction} className="space-y-3">
          {state.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{state.error}</AlertDescription>
            </Alert>
          )}
          <Input type="password" name="password" placeholder="Senha da família" autoFocus required />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
