
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const paginasSistema = [
  { id: 'regulacao-leitos', label: 'Regulação de Leitos' },
  { id: 'mapa-leitos', label: 'Mapa de Leitos' },
  { id: 'central-higienizacao', label: 'Central de Higienização' },
  { id: 'gestao-isolamentos', label: 'Gestão de Isolamentos' },
  { id: 'marcacao-cirurgica', label: 'Marcação Cirúrgica' },
  { id: 'huddle', label: 'Huddle' },
  { id: 'gestao-estrategica', label: 'Gestão Estratégica' },
  { id: 'auditoria', label: 'Auditoria' },
  { id: 'gestao-usuarios', label: 'Gestão de Usuários' },
];

const formSchema = z.object({
  nomeCompleto: z.string()
    .min(3, { message: "O nome deve ter no mínimo 3 caracteres." })
    .regex(/^[a-zA-Z\s]+$/, { message: "O nome deve conter apenas letras e espaços." }),
  matricula: z.string()
    .regex(/^\d+$/, { message: "A matrícula deve conter apenas números." }),
  email: z.string()
    .min(1, { message: "O e-mail é obrigatório." })
    .refine(email => !email.includes('@'), { message: "Não inclua o '@' no e-mail." }),
  tipoAcesso: z.enum(['Comum', 'Administrador']),
  permissoes: z.array(z.string()).optional(),
});

interface UsuarioFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export const UsuarioForm = ({ onSubmit, initialData, loading }: UsuarioFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nomeCompleto: '',
      matricula: '',
      email: '',
      tipoAcesso: 'Administrador',
      permissoes: [],
    },
  });

  const tipoAcesso = form.watch('tipoAcesso');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nomeCompleto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Digite o nome completo" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="matricula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Digite a matrícula" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <Input {...field} placeholder="usuario" className="rounded-r-none" />
                  <span className="p-2 bg-muted border border-l-0 rounded-r-md text-sm">
                    @joinville.sc.gov.br
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipoAcesso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Acesso</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="Comum" />
                    </FormControl>
                    <FormLabel className="font-normal">Comum</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="Administrador" />
                    </FormControl>
                    <FormLabel className="font-normal">Administrador</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoAcesso === 'Comum' && (
          <FormField
            control={form.control}
            name="permissoes"
            render={() => (
              <FormItem>
                <FormLabel>Permissões</FormLabel>
                <div className="p-4 border rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    {paginasSistema.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="permissoes"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, item.id]);
                                  } else {
                                    field.onChange(
                                      currentValue.filter((value) => value !== item.id)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Salvando...' : 'Salvar Usuário'}
        </Button>
      </form>
    </Form>
  );
};
