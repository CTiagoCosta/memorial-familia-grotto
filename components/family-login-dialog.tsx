"use client"

import { useActionState, useState } from "react"
import { Lock, Shield, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
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
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Senha da família"
              autoFocus
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
