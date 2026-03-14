import { useEffect } from "react";
import { type PageContext, setPageContext, clearPageContext } from "./pageContext";

export function usePageContext(ctx: PageContext): void {
  useEffect(() => {
    setPageContext(ctx);
    return () => clearPageContext();
  }, [ctx.module, ctx.resourceType, ctx.resourceId]);
}
