

export const LyricsPage = ({ children }) => {
  return (
    <section className="h-screen w-screen relative grid">
      {children}
    </section>
  );
};

export const LyricsPageWrapper = ({ children }) => {
  return <div className="grid h-screen">{children}</div>;
};

export const LyricsPageContainer = ({ children }) => {
  return (
    <div className="grid grid-rows-[5fr_1fr] relative m-4 w-[80vw] text-5xl font-bold overflow-hidden">
      {children}
    </div>
  );
};

export const LoadingContainer = ({ children }) => {
  return (
    <div className="absolute flex h-screen w-screen justify-center items-center">
      {children}
    </div>
  );
};