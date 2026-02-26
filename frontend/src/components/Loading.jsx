import { Loader2 } from 'lucide-react';

const Loading = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
      <p className="text-gray-600">{text}</p>
    </div>
  );
};

export default Loading;
