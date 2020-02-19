#nullable enable

using System.Linq;
using Hediet.DebugVisualizer.ExtractedData;

namespace Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            var list = new LinkedList<int>();
            // visualize `list.Visualize()` here!
            list.Append(1);
            list.Append(2);
            list.Append(3);
            list.Append(4);
        }
    }

    class LinkedList<T>
    {
        class Node
        {
            public Node(T value) { Value = value; }
            public T Value { get; set; }
            public Node? Next { get; set; }
        }

        private Node? Head { get; set; }

        public void Append(T item)
        {
            if (this.Head == null)
            {
                this.Head = new Node(item);
            }
            else
            {
                var cur = this.Head;
                while (cur.Next != null)
                {
                    cur = cur.Next;
                }
                cur.Next = new Node(item);
            }
        }

        public ExtractedData Visualize()
        {
            var list = new Node(default(T)!) { Next = this.Head };
            return GraphData.From(new[] { list }.Where(i => i != null), (item, info) =>
            {
                info.Id = item == list ? "List" : string.Format("{0}", item.Value);
                if (item == list)
                {
                    info.Color = "orange";
                }
                if (item.Next != null)
                    info.AddEdge(item.Next!, label: item == list ? "head" : "next");
                return info;
            });
        }
    }
}
