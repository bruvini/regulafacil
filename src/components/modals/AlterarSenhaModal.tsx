
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getAuth, updatePassword } from 'firebase/auth';

const passwordSchema = z.object({
  novaSenha: z.string()
    .min(6, "A senha deve ter no mínimo 6 caracteres.")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial."),
  confirmarSenha: z.string()
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});

export const AlterarSenhaModal = ({ open }: { open: boolean }) => {
  const { toast } = useToast();
  const auth = getAuth();
  const form = useForm({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updatePassword(user, data.novaSenha);
      toast({ title: "Sucesso!", description: "Sua senha foi alterada. Você pode fazer login novamente." });
      auth.signOut(); // Desloga o usuário para que ele entre com a nova senha
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível alterar sua senha.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Primeiro Acesso - Altere sua Senha</DialogTitle>
          <DialogDescription>Por segurança, você precisa definir uma nova senha para continuar.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="novaSenha" render={({ field }) => (
              <FormItem><FormLabel>Nova Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="confirmarSenha" render={({ field }) => (
              <FormItem><FormLabel>Confirmar Nova Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="submit">Salvar Nova Senha</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
