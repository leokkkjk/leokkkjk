"use client";

import { useActionState, useState } from "react";

import { entrarAction, type EstadoLogin } from "@/app/actions/auth";
import { IconeOlho, IconeOlhoFechado, IconeSetaDireita } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const estadoInicial: EstadoLogin = { erro: null };

/**
 * Formulário de login (client): controla os campos para que a senha digitada
 * não suma quando a action devolve erro — o React limpa campos não controlados
 * após o submit.
 *
 * A lista de usuários de teste FOI REMOVIDA daqui (brief desta sessão): as
 * credenciais de demonstração vivem apenas no README.
 */
export default function FormularioLogin({ proximo }: { proximo: string }) {
  const [estado, acao, pendente] = useActionState(entrarAction, estadoInicial);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const invalido = Boolean(estado.erro);

  return (
    <form action={acao} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={proximo} />

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="voce@empresa.com"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          aria-invalid={invalido}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <div className="relative">
          <Input
            id="senha"
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="pr-12"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            aria-invalid={invalido}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((valor) => !valor)}
            aria-label={mostrarSenha ? "Ocultar a senha" : "Mostrar a senha"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-ink-400 transition-colors duration-150 hover:text-ink-700"
          >
            {mostrarSenha ? <IconeOlhoFechado className="size-4" /> : <IconeOlho className="size-4" />}
          </button>
        </div>
      </div>

      {estado.erro ? (
        <Alert variant="critico">
          <div className="space-y-1">
            <AlertTitle>Não foi possível entrar</AlertTitle>
            <AlertDescription>{estado.erro}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pendente}>
        {pendente ? (
          <>
            <Spinner />
            Entrando…
          </>
        ) : (
          <>
            Entrar
            <IconeSetaDireita />
          </>
        )}
      </Button>
    </form>
  );
}

/** Anel girando — única animação de "carregando", feita com transform. */
function Spinner() {
  return (
    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}
